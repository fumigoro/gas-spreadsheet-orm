import type { ColumnDef } from "./types";

// Column builders
export function column<T>(
	columnName: string,
	options?: Omit<ColumnDef<T>, "column">,
): ColumnDef<T> {
	return {
		column: columnName,
		...options,
	};
}

// Convenience builders for common types
export const string = (
	columnName: string,
	options?: Omit<ColumnDef<string>, "column">,
) => column<string>(columnName, options);

export const number = (
	columnName: string,
	options?: Omit<ColumnDef<number>, "column">,
) => column<number>(columnName, options);

export const boolean = (
	columnName: string,
	options?: Omit<ColumnDef<boolean>, "column">,
) => column<boolean>(columnName, options);

export const date = (
	columnName: string,
	options?: Omit<ColumnDef<Date>, "column">,
) =>
	column<Date>(columnName, {
		parser: (value: unknown) =>
			value instanceof Date ? value : new Date(value as string),
		serializer: (value: Date) => value.toISOString(),
		...options,
	});
