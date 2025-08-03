// Export main client
export { SpreadsheetClient } from "./client";

// Export schema builders
export {
	column,
	defineSchema,
	createSheetClient,
} from "./schema";

// Export types
export type {
	ColumnDef,
	CreateArgs,
	DeleteArgs,
	FindManyArgs,
	FindUniqueArgs,
	InferRecord,
	TableSchema,
	UpdateArgs,
	WhereCondition,
} from "./types";
