// Export main client
export { createSpreadsheetClient, SpreadsheetClient } from "./client";

// Export schema builders
export { column, defineSchema, defineTable } from "./schema";

// Export types
export type {
	ColumnDefinition,
	ColumnType,
	CreateArgs,
	DeleteArgs,
	DeleteManyArgs,
	FindManyArgs,
	FindUniqueArgs,
	InferModelType,
	SchemaDefinition,
	UpdateArgs,
	WhereCondition,
} from "./types";
