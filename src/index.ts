// Export main client
export { createSpreadsheetClient, SpreadsheetClient } from './client';

// Export schema builders
export { column, defineTable, defineSchema } from './schema';

// Export types
export type {
  ColumnType,
  ColumnDefinition,
  SchemaDefinition,
  InferModelType,
  WhereCondition,
  FindManyArgs,
  FindUniqueArgs,
  CreateArgs,
  UpdateArgs,
  DeleteArgs,
  DeleteManyArgs,
} from './types';

// Export legacy exports for backward compatibility
export { SpreadSheetColumn, SpreadSheetMapper } from './SpreadSheetMapper';