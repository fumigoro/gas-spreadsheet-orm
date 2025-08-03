import type { ColumnDefinition } from "./types";

// Schema builder functions
export const column = {
	string: (
		columnName: string,
		options?: Partial<ColumnDefinition>,
	): ColumnDefinition => ({
		type: "string",
		column: columnName,
		...options,
	}),

	number: (
		columnName: string,
		options?: Partial<ColumnDefinition>,
	): ColumnDefinition => ({
		type: "number",
		column: columnName,
		...options,
	}),

	boolean: (
		columnName: string,
		options?: Partial<ColumnDefinition>,
	): ColumnDefinition => ({
		type: "boolean",
		column: columnName,
		...options,
	}),

	date: (
		columnName: string,
		options?: Partial<ColumnDefinition>,
	): ColumnDefinition => ({
		type: "date",
		column: columnName,
		parser: (value: any) => (value instanceof Date ? value : new Date(value)),
		serializer: (value: Date) => value.toISOString(),
		...options,
	}),
};

// Helper function to define a table schema
export function defineTable<T extends Record<string, ColumnDefinition>>(
	schema: T,
): T {
	return schema;
}

// Helper function to define the entire schema
export function defineSchema<
	T extends Record<string, Record<string, ColumnDefinition>>,
>(schema: T): T {
	return schema;
}
