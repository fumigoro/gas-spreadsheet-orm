// Core types for the Spreadsheet ORM

export type ColumnType = 'string' | 'number' | 'boolean' | 'date';

export interface ColumnDefinition {
  type: ColumnType;
  column: string;
  primary?: boolean;
  unique?: boolean;
  required?: boolean;
  default?: any | (() => any);
  parser?: (value: any) => any;
  serializer?: (value: any) => any;
}

export type SchemaDefinition = {
  [tableName: string]: {
    [fieldName: string]: ColumnDefinition;
  };
};

export type InferModelType<T extends Record<string, ColumnDefinition>> = {
  [K in keyof T]: T[K]['type'] extends 'string' 
    ? string 
    : T[K]['type'] extends 'number'
    ? number
    : T[K]['type'] extends 'boolean'
    ? boolean
    : T[K]['type'] extends 'date'
    ? Date
    : any;
};

// Query types
type FilterOperators<T> = {
  equals?: T;
  not?: T;
  in?: T[];
  notIn?: T[];
} & (T extends string ? {
  contains?: string;
  startsWith?: string;
  endsWith?: string;
} : {}) & (T extends number | Date ? {
  lt?: T;
  lte?: T;
  gt?: T;
  gte?: T;
} : {});

export type WhereCondition<T> = {
  [K in keyof T]?: T[K] | FilterOperators<T[K]>;
};

export interface FindManyArgs<T> {
  where?: WhereCondition<T>;
  orderBy?: {
    [K in keyof T]?: 'asc' | 'desc';
  };
  take?: number;
  skip?: number;
}

export interface FindUniqueArgs<T> {
  where: WhereCondition<T>;
}

export interface CreateArgs<T> {
  data: Partial<Omit<T, 'id'>> & { id?: T extends { id: infer U } ? U : never };
}

export interface UpdateArgs<T> {
  where: WhereCondition<T>;
  data: Partial<T>;
}

export interface DeleteArgs<T> {
  where: WhereCondition<T>;
}

export interface DeleteManyArgs<T> {
  where?: WhereCondition<T>;
}
