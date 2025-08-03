import { QueryEngine } from "./query-engine";
import type {
	ColumnDefinition,
	CreateArgs,
	DeleteArgs,
	DeleteManyArgs,
	FindManyArgs,
	FindUniqueArgs,
	InferModelType,
	UpdateArgs,
} from "./types";

export class TableModel<T extends Record<string, ColumnDefinition>> {
	private sheet!: GoogleAppsScript.Spreadsheet.Sheet;
	private data: InferModelType<T>[] = [];
	private headers!: string[];
	private columnMap: Map<string, ColumnDefinition> = new Map();
	private primaryKey!: string;

	constructor(
		private spreadsheetId: string,
		private sheetName: string,
		private schema: T,
	) {
		this.setupColumnMap();
		this.initializeSheet();
		this.load();
	}

	private setupColumnMap(): void {
		for (const [fieldName, columnDef] of Object.entries(this.schema)) {
			this.columnMap.set(fieldName, columnDef);
			if (columnDef.primary) {
				this.primaryKey = fieldName;
			}
		}

		// If no primary key is defined, assume 'id' is the primary key
		if (!this.primaryKey && this.schema.id) {
			this.primaryKey = "id";
		}
	}

	private initializeSheet(): void {
		const spreadSheet = SpreadsheetApp.openById(this.spreadsheetId);
		const sheet = spreadSheet.getSheetByName(this.sheetName);
		if (!sheet) {
			throw new Error(`Sheet '${this.sheetName}' not found`);
		}
		this.sheet = sheet;
		this.headers = this.sheet.getDataRange().getValues()[0] as string[];
	}

	private mapRowToObject(row: unknown[]): InferModelType<T> {
		const obj = {} as Record<keyof T, unknown>;

		for (const [fieldName, columnDef] of Object.entries(this.schema) as Array<
			[keyof T, ColumnDefinition]
		>) {
			const colIndex = this.headers.indexOf(columnDef.column);
			if (colIndex !== -1) {
				let value = row[colIndex];
				if (columnDef.parser) {
					value = columnDef.parser(value);
				}
				obj[fieldName] = value;
			}
		}

		return obj as InferModelType<T>;
	}

	private mapObjectToRow(obj: InferModelType<T>): unknown[] {
		return this.headers.map((header) => {
			const fieldEntry = Object.entries(this.schema).find(
				([_, columnDef]) => columnDef.column === header,
			) as [keyof T, ColumnDefinition] | undefined;

			if (fieldEntry) {
				const [fieldName, columnDef] = fieldEntry;
				let value = obj[fieldName];
				if (columnDef.serializer) {
					value = columnDef.serializer(value as unknown) as typeof value;
				}
				return value;
			}
			return "";
		});
	}

	private load(): void {
		const rows = this.sheet.getDataRange().getValues();
		this.data = rows.slice(1).map((row) => this.mapRowToObject(row));
	}

	private findRowIndex(id: InferModelType<T>[keyof T]): number {
		return this.data.findIndex(
			(item) => item[this.primaryKey as keyof InferModelType<T>] === id,
		);
	}

	// Public API methods (Prisma-like)
	async findMany(
		args?: FindManyArgs<InferModelType<T>>,
	): Promise<InferModelType<T>[]> {
		const queryEngine = new QueryEngine(this.data);
		let result = this.data;

		if (args?.where) {
			result = queryEngine.filter(args.where);
		}

		if (args?.orderBy) {
			const engine = new QueryEngine(result);
			result = engine.sort(args.orderBy);
		}

		if (args?.skip || args?.take) {
			const engine = new QueryEngine(result);
			result = engine.paginate(args.take, args.skip);
		}

		return result;
	}

	async findUnique(
		args: FindUniqueArgs<InferModelType<T>>,
	): Promise<InferModelType<T> | null> {
		const queryEngine = new QueryEngine(this.data);
		const result = queryEngine.findFirst(args.where);
		return result || null;
	}

	async findFirst(
		args: FindUniqueArgs<InferModelType<T>>,
	): Promise<InferModelType<T> | null> {
		return this.findUnique(args);
	}

	async create(
		args: CreateArgs<InferModelType<T>>,
	): Promise<InferModelType<T>> {
		const newData = { ...args.data } as Record<keyof T, unknown>;

		// Apply defaults
		for (const [fieldName, columnDef] of Object.entries(this.schema) as Array<
			[keyof T, ColumnDefinition]
		>) {
			if (columnDef.default !== undefined && newData[fieldName] === undefined) {
				newData[fieldName] =
					typeof columnDef.default === "function"
						? columnDef.default()
						: columnDef.default;
			}
		}

		// Check for duplicate primary key
		const primaryKeyField = this.primaryKey as keyof InferModelType<T>;
		if (this.primaryKey && newData[primaryKeyField] !== undefined) {
			const primaryKeyValue = newData[primaryKeyField];
			const existing = this.data.find(
				(item) => item[primaryKeyField] === primaryKeyValue,
			);
			if (existing) {
				throw new Error(
					`Record with ${String(this.primaryKey)} '${String(primaryKeyValue)}' already exists`,
				);
			}
		}

		const typedNewData = newData as InferModelType<T>;
		this.data.push(typedNewData);
		const values = this.mapObjectToRow(typedNewData);
		this.sheet.appendRow(values);

		return typedNewData;
	}

	async update(
		args: UpdateArgs<InferModelType<T>>,
	): Promise<InferModelType<T>> {
		const queryEngine = new QueryEngine(this.data);
		const existing = queryEngine.findFirst(args.where);

		if (!existing) {
			throw new Error("Record not found");
		}

		const primaryKeyField = this.primaryKey as keyof InferModelType<T>;
		const primaryKeyValue = existing[primaryKeyField];
		const targetIndex = this.findRowIndex(primaryKeyValue);

		if (targetIndex === -1) {
			throw new Error("Record not found");
		}

		const updatedData = { ...existing, ...args.data } as InferModelType<T>;
		this.data[targetIndex] = updatedData;

		const values = this.mapObjectToRow(updatedData);
		this.sheet
			.getRange(targetIndex + 2, 1, 1, values.length)
			.setValues([values]);

		return updatedData;
	}

	async delete(
		args: DeleteArgs<InferModelType<T>>,
	): Promise<InferModelType<T>> {
		const queryEngine = new QueryEngine(this.data);
		const existing = queryEngine.findFirst(args.where);

		if (!existing) {
			throw new Error("Record not found");
		}

		const primaryKeyField = this.primaryKey as keyof InferModelType<T>;
		const primaryKeyValue = existing[primaryKeyField];
		const targetIndex = this.findRowIndex(primaryKeyValue);

		if (targetIndex === -1) {
			throw new Error("Record not found");
		}

		this.data.splice(targetIndex, 1);
		this.sheet.deleteRow(targetIndex + 2);

		return existing;
	}

	async deleteMany(
		args?: DeleteManyArgs<InferModelType<T>>,
	): Promise<{ count: number }> {
		let toDelete = this.data;

		if (args?.where) {
			const queryEngine = new QueryEngine(this.data);
			toDelete = queryEngine.filter(args.where);
		}

		// Delete in reverse order to maintain row indices
		const primaryKeyField = this.primaryKey as keyof InferModelType<T>;
		const indices = toDelete
			.map((item) => this.findRowIndex(item[primaryKeyField]))
			.sort((a, b) => b - a);

		for (const index of indices) {
			if (index !== -1) {
				this.data.splice(index, 1);
				this.sheet.deleteRow(index + 2);
			}
		}

		return { count: indices.length };
	}

	async count(args?: FindManyArgs<InferModelType<T>>): Promise<number> {
		const results = await this.findMany(args);
		return results.length;
	}
}
