// Core types for the Spreadsheet ORM

// Column definition with type inference
export interface ColumnDef<T = unknown> {
	column: string;
	primary?: boolean;
	nullable?: boolean;
	default?: T | (() => T);
	parser?: (value: unknown) => T;
	serializer?: (value: T) => unknown;
}

// Schema definition for a single table - use any to allow different column types
export type TableSchema = Record<string, ColumnDef<any>>;

// Extract TypeScript types from schema
export type InferRecord<T extends TableSchema> = {
	[K in keyof T]: T[K] extends ColumnDef<infer U> ? U : unknown;
};

// Simplified CRUD argument types
export interface FindArgs<T> {
	where: Partial<T>;
}

export interface CreateArgs<T> {
	data: T;
}

export interface UpdateArgs<T> {
	where: Partial<T>;
	data: Partial<T>;
}

export interface DeleteArgs<T> {
	where: Partial<T>;
}
