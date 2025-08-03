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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableSchema = Record<string, ColumnDef<any>>;

// Extract TypeScript types from schema
export type InferRecord<T extends TableSchema> = {
	[K in keyof T]: T[K] extends ColumnDef<infer U> ? U : unknown;
};

// Query types
export type WhereCondition<T> = {
	[K in keyof T]?:
		| T[K]
		| {
				equals?: T[K];
				not?: T[K];
				in?: T[K][];
				notIn?: T[K][];
				contains?: T[K] extends string ? string : never;
				startsWith?: T[K] extends string ? string : never;
				endsWith?: T[K] extends string ? string : never;
				lt?: T[K] extends number | Date ? T[K] : never;
				lte?: T[K] extends number | Date ? T[K] : never;
				gt?: T[K] extends number | Date ? T[K] : never;
				gte?: T[K] extends number | Date ? T[K] : never;
		  };
};

export interface FindManyArgs<T> {
	where?: WhereCondition<T>;
	orderBy?: { [K in keyof T]?: "asc" | "desc" };
	take?: number;
	skip?: number;
}

export interface FindUniqueArgs<T> {
	where: WhereCondition<T>;
}

export interface CreateArgs<T> {
	data: T;
}

export interface UpdateArgs<T> {
	where: WhereCondition<T>;
	data: Partial<T>;
}

export interface DeleteArgs<T> {
	where: WhereCondition<T>;
}
