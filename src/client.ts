import type {
	CreateArgs,
	DeleteArgs,
	FindManyArgs,
	FindUniqueArgs,
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
		this.loadData();
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

	private loadData(): void {
		const rows = this.sheet.getDataRange().getValues();
		this.data = rows.slice(1).map((row) => this.parseRow(row));
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

	private findRecordIndex(where: Record<string, unknown>): number {
		return this.data.findIndex((record) => {
			return Object.entries(where).every(([key, value]) => {
				return record[key as keyof InferRecord<T>] === value;
			});
		});
	}

	// Public API
	async findMany(
		args?: FindManyArgs<InferRecord<T>>,
	): Promise<InferRecord<T>[]> {
		let result = [...this.data];

		if (args?.where) {
			result = result.filter((record) =>
				this.matchesWhere(record, args.where as Record<string, unknown>),
			);
		}

		if (args?.orderBy) {
			const [field, direction] = Object.entries(args.orderBy)[0];
			result.sort((a, b) => {
				const aVal = a[field as keyof InferRecord<T>];
				const bVal = b[field as keyof InferRecord<T>];
				const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
				return direction === "desc" ? -comparison : comparison;
			});
		}

		if (args?.skip) {
			result = result.slice(args.skip);
		}

		if (args?.take) {
			result = result.slice(0, args.take);
		}

		return result;
	}

	async findUnique(
		args: FindUniqueArgs<InferRecord<T>>,
	): Promise<InferRecord<T> | null> {
		const record = this.data.find((record) =>
			this.matchesWhere(record, args.where),
		);
		return record || null;
	}

	async create(args: CreateArgs<InferRecord<T>>): Promise<InferRecord<T>> {
		const record = this.applyDefaults(args.data);

		this.data.push(record);
		const values = this.serializeRow(record);
		this.sheet.appendRow(values);

		return record;
	}

	async update(args: UpdateArgs<InferRecord<T>>): Promise<InferRecord<T>> {
		const index = this.findRecordIndex(args.where as Record<string, unknown>);
		if (index === -1) {
			throw new Error("Record not found");
		}

		const updatedRecord = { ...this.data[index], ...args.data };
		this.data[index] = updatedRecord;

		const values = this.serializeRow(updatedRecord);
		this.sheet.getRange(index + 2, 1, 1, values.length).setValues([values]);

		return updatedRecord;
	}

	async delete(args: DeleteArgs<InferRecord<T>>): Promise<InferRecord<T>> {
		const index = this.findRecordIndex(args.where as Record<string, unknown>);
		if (index === -1) {
			throw new Error("Record not found");
		}

		const deletedRecord = this.data[index];
		this.data.splice(index, 1);
		this.sheet.deleteRow(index + 2);

		return deletedRecord;
	}

	async count(args?: FindManyArgs<InferRecord<T>>): Promise<number> {
		const results = await this.findMany(args);
		return results.length;
	}

	private matchesWhere(
		record: InferRecord<T>,
		where: Record<string, unknown>,
	): boolean {
		return Object.entries(where).every(([key, condition]) => {
			const value = record[key as keyof InferRecord<T>];

			if (typeof condition === "object" && condition !== null) {
				// Handle filter operators
				return Object.entries(condition).every(([op, opValue]) => {
					switch (op) {
						case "equals":
							return value === opValue;
						case "not":
							return value !== opValue;
						case "in":
							return Array.isArray(opValue) && opValue.includes(value);
						case "notIn":
							return Array.isArray(opValue) && !opValue.includes(value);
						case "contains":
							return (
								typeof value === "string" && value.includes(opValue as string)
							);
						case "startsWith":
							return (
								typeof value === "string" && value.startsWith(opValue as string)
							);
						case "endsWith":
							return (
								typeof value === "string" && value.endsWith(opValue as string)
							);
						case "lt":
							return (value as number | Date) < (opValue as number | Date);
						case "lte":
							return (value as number | Date) <= (opValue as number | Date);
						case "gt":
							return (value as number | Date) > (opValue as number | Date);
						case "gte":
							return (value as number | Date) >= (opValue as number | Date);
						default:
							return false;
					}
				});
			} else {
				// Direct value comparison
				return value === condition;
			}
		});
	}
}
