import { TableModel } from "./table-model";
import type { SchemaDefinition } from "./types";

type ClientModels<TSchema extends SchemaDefinition> = {
	[K in keyof TSchema]: TableModel<TSchema[K]>;
};

export class SpreadsheetClient<TSchema extends SchemaDefinition> {
	private models: ClientModels<TSchema> = {} as ClientModels<TSchema>;

	constructor(
		private config: {
			spreadsheetId: string;
			schema: TSchema;
		},
	) {
		this.initializeModels();
	}

	private initializeModels(): void {
		const temporaryModels: Record<string, unknown> = {};
		for (const [tableName, tableSchema] of Object.entries(this.config.schema)) {
			// Create a model for each table in the schema
			temporaryModels[tableName] = new TableModel(
				this.config.spreadsheetId,
				tableName,
				tableSchema,
			);
		}
		this.models = temporaryModels as ClientModels<TSchema>;
	}

	// Dynamic property access for models
	get<K extends keyof TSchema>(tableName: K): TableModel<TSchema[K]> {
		const model = this.models[tableName];
		if (!model) {
			throw new Error(`Model '${String(tableName)}' not found`);
		}
		return model;
	}
}

// Proxy to enable dynamic property access like client.user, client.post, etc.
export function createSpreadsheetClient<
	TSchema extends SchemaDefinition,
>(config: {
	spreadsheetId: string;
	schema: TSchema;
}): SpreadsheetClient<TSchema> & ClientModels<TSchema> {
	const client = new SpreadsheetClient(config);

	return new Proxy(
		client as SpreadsheetClient<TSchema> & ClientModels<TSchema>,
		{
			get(target, prop: string | symbol) {
				if (typeof prop === "string" && prop in config.schema) {
					return target.get(prop);
				}
				return target[prop as keyof typeof target];
			},
		},
	);
}
