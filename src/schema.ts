import { SpreadsheetClient } from "./client";
import type { ColumnDef, TableSchema } from "./types";

// Schema builder with better type inference
export function defineSchema<T extends TableSchema>(schema: T): T {
	return schema;
}

// Client factory function
export function createSheetClient<T extends TableSchema>(config: {
	spreadsheetId: string;
	sheetName: string;
	schema: T;
}): SpreadsheetClient<T> {
	return new SpreadsheetClient(config);
}

// Column builders
function defineColumn<T>(
	columnName: string,
	options?: Omit<ColumnDef<T>, "column">,
): ColumnDef<T> {
	return {
		column: columnName,
		...options,
	};
}

// Convenience builders for common types
function string(
	columnName: string,
	options?: Omit<ColumnDef<string>, "column">,
) {
	return defineColumn<string>(columnName, options);
}

function number(
	columnName: string,
	options?: Omit<ColumnDef<number>, "column">,
) {
	return defineColumn<number>(columnName, options);
}

function boolean(
	columnName: string,
	options?: Omit<ColumnDef<boolean>, "column">,
) {
	return defineColumn<boolean>(columnName, options);
}

function date(columnName: string, options?: Omit<ColumnDef<Date>, "column">) {
	return defineColumn<Date>(columnName, options);
}

function custom<T>(
	columnName: string,
	options?: Omit<ColumnDef<T>, "column">,
): ColumnDef<T> {
	return defineColumn<T>(columnName, options);
}

export const column = {
	// Alias for column to maintain backward compatibility
	string,
	number,
	boolean,
	date,
	custom,
};
