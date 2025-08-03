import { TableModel } from "./table-model";
import type { SchemaDefinition } from "./types";

type ClientModels<TSchema extends SchemaDefinition> = {
	[K in keyof TSchema]: TableModel<TSchema[K]>;
};

export class SpreadsheetClient<TSchema extends SchemaDefinition> {
	public models: ClientModels<TSchema> = {} as ClientModels<TSchema>;

	constructor(
		private config: {
			spreadsheetId: string;
			schema: TSchema;
		},
	) {
		this.initializeModels();
	}

	private initializeModels(): void {
		for (const tableName in this.config.schema) {
			this.models[tableName] = new TableModel(
				this.config.spreadsheetId,
				tableName,
				this.config.schema[tableName],
			);
		}
	}
}

// Proxy to enable dynamic property access like client.user, client.post, etc.
export function createSpreadsheetClient<
	TSchema extends SchemaDefinition,
>(config: {
	spreadsheetId: string;
	schema: TSchema;
}): ClientModels<TSchema> {
	const client = new SpreadsheetClient(config);

	return new Proxy(
		client.models,
		{
			get(target, prop: string | symbol) {
				if (!(prop in target)) {
					throw new Error(`Table '${String(prop)}' not found in schema`);
				}
				
				// 一旦Symbolアクセスは想定しないことにする。
				if (typeof prop === "symbol") {
					return undefined;
				}
				
				return target[prop as keyof typeof target];
			},
		},
	) as ClientModels<TSchema>;
}
