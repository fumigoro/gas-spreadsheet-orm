import type {
	CreateArgs,
	DeleteArgs,
	FindArgs,
	InferRecord,
	TableSchema,
	UpdateArgs,
} from "./types";

export class SpreadsheetClient<T extends TableSchema> {
	private sheet!: GoogleAppsScript.Spreadsheet.Sheet;
	private data: InferRecord<T>[] = [];
	private headers: string[] = [];
	private schema: T;

	constructor(config: {
		spreadsheetId: string;
		sheetName: string;
		schema: T;
	}) {
		this.schema = config.schema;
		this.validateSchema();
		this.initializeSheet(config.spreadsheetId, config.sheetName);
		this.load();
	}

	private validateSchema(): void {
		const primaryKeys = Object.entries(this.schema)
			.filter(([, columnDef]) => columnDef.primary)
			.map(([fieldName]) => fieldName);

		if (primaryKeys.length === 0) {
			throw new Error("No primary key defined in schema");
		}
		if (primaryKeys.length > 1) {
			throw new Error("Multiple primary keys are not supported");
		}
	}

	private initializeSheet(spreadsheetId: string, sheetName: string): void {
		const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
		const sheet = spreadsheet.getSheetByName(sheetName);
		if (!sheet) {
			throw new Error(`Sheet '${sheetName}' not found`);
		}
		this.sheet = sheet;
		this.headers = this.sheet.getDataRange().getValues()[0] as string[];
	}

	private parseRow(row: unknown[]): InferRecord<T> {
		const record: Record<string, unknown> = {};

		for (const [fieldName, columnDef] of Object.entries(this.schema)) {
			const colIndex = this.headers.indexOf(columnDef.column);
			if (colIndex !== -1) {
				let value = row[colIndex];
				if (columnDef.parser && value != null) {
					value = columnDef.parser(value);
				}
				record[fieldName] = value;
			}
		}

		return record as InferRecord<T>;
	}

	private serializeRow(record: InferRecord<T>): unknown[] {
		return this.headers.map((header) => {
			const fieldEntry = Object.entries(this.schema).find(
				([, columnDef]) => columnDef.column === header,
			);

			if (fieldEntry) {
				const [fieldName, columnDef] = fieldEntry;
				const value = record[fieldName as keyof InferRecord<T>];
				if (columnDef.serializer && value != null) {
					return columnDef.serializer(value as never);
				}
				return value;
			}
			return "";
		});
	}

	private applyDefaults(data: Partial<InferRecord<T>>): InferRecord<T> {
		const result = { ...data } as Record<string, unknown>;

		for (const [fieldName, columnDef] of Object.entries(this.schema)) {
			if (result[fieldName] == null && columnDef.default != null) {
				result[fieldName] =
					typeof columnDef.default === "function"
						? (columnDef.default as () => unknown)()
						: columnDef.default;
			}
		}

		return result as InferRecord<T>;
	}

	private getPrimaryKeyField(): string {
		const primaryKeys = Object.entries(this.schema)
			.filter(([, columnDef]) => columnDef.primary)
			.map(([fieldName]) => fieldName);

		if (primaryKeys.length === 0) {
			throw new Error("No primary key defined in schema");
		}
		return primaryKeys[0];
	}

	private findRecordByData(data: Partial<InferRecord<T>>): number {
		return this.data.findIndex((record) => {
			return Object.entries(data).every(([key, value]) => {
				return record[key as keyof InferRecord<T>] === value;
			});
		});
	}

	// Public API Methods

	/**
	 * Returns all records currently loaded in memory as a copy.
	 * This operation is read-only and does not affect the original data.
	 * @returns Array of all records in memory
	 */
	list(): InferRecord<T>[] {
		return [...this.data];
	}

	/**
	 * Finds a single record by its primary key value from memory.
	 * @param id - The primary key value to search for
	 * @returns The matching record or null if not found
	 */
	get(id: unknown): InferRecord<T> | null {
		const primaryKeyField = this.getPrimaryKeyField();
		const record = this.data.find(
			(record) => record[primaryKeyField as keyof InferRecord<T>] === id,
		);
		return record || null;
	}

	/**
	 * Finds a single record by matching partial data from memory.
	 * @param args - Object containing the search criteria
	 * @returns The matching record or null if not found
	 */
	find(args: FindArgs<InferRecord<T>>): InferRecord<T> | null {
		const index = this.findRecordByData(args.where);
		if (index === -1) {
			return null;
		}
		return this.data[index];
	}

	/**
	 * Creates a new record in memory only. Does not write to spreadsheet.
	 * Use save() method to persist changes to spreadsheet.
	 * @param args - Object containing the data to create
	 * @returns The created record with defaults applied
	 */
	create(args: CreateArgs<InferRecord<T>>): InferRecord<T> {
		const record = this.applyDefaults(args.data);
		this.data.push(record);
		return record;
	}

	/**
	 * Updates an existing record in memory only. Does not write to spreadsheet.
	 * Finds the record by matching the provided data fields.
	 * Use save() method to persist changes to spreadsheet.
	 * @param args - Object containing the data to match and update
	 * @returns The updated record
	 * @throws Error if no matching record is found
	 */
	update(args: UpdateArgs<InferRecord<T>>): InferRecord<T> {
		const index = this.findRecordByData(args.where);
		if (index === -1) {
			throw new Error("Record not found");
		}

		const updatedRecord = { ...this.data[index], ...args.data };
		this.data[index] = updatedRecord;
		return updatedRecord;
	}

	/**
	 * Deletes a record from memory only. Does not write to spreadsheet.
	 * Finds the record by matching the provided data fields.
	 * Use save() method to persist changes to spreadsheet.
	 * @param args - Object containing the data to match for deletion
	 * @returns The deleted record
	 * @throws Error if no matching record is found
	 */
	delete(args: DeleteArgs<InferRecord<T>>): InferRecord<T> {
		const index = this.findRecordByData(args.where);
		if (index === -1) {
			throw new Error("Record not found");
		}

		const deletedRecord = this.data[index];
		this.data.splice(index, 1);
		return deletedRecord;
	}

	/**
	 * Loads data from the spreadsheet into memory.
	 * This replaces any existing data in memory.
	 * @throws Error if spreadsheet operations fail
	 */
	load(): void {
		const rows = this.sheet.getDataRange().getValues();
		const dataRows = rows.slice(1);
		this.data = dataRows.map((row) => this.parseRow(row));
	}

	/**
	 * Saves all in-memory data to the spreadsheet.
	 * This operation clears all existing data in the spreadsheet (except headers)
	 * and writes all current in-memory records.
	 * @throws Error if spreadsheet operations fail
	 */
	save(): void {
		// Clear existing data (except header)
		const lastRow = this.sheet.getLastRow();
		if (lastRow > 1) {
			// より安全な方法で既存データをクリア
			const range = this.sheet.getRange(2, 1, lastRow - 1, this.headers.length);
			range.clearContent();
		}

		// Write all data
		if (this.data.length > 0) {
			const serializedData = this.data.map((record) => this.serializeRow(record));
			this.sheet.getRange(2, 1, serializedData.length, serializedData[0].length)
				.setValues(serializedData);
		}
	}
}
