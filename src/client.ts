import { TableModel } from "./table-model";
import type { SchemaDefinition } from "./types";

type ClientModels<TSchema extends SchemaDefinition> = {
	[K in keyof TSchema]: TableModel<TSchema[K]>;
};

export class SpreadsheetClient<TSchema extends SchemaDefinition> {
	// initializeModels()で全プロパティが揃うので、空オブジェクトにasで代入後の型を設定
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

// client.user のように動的にテーブル名のプロパティにアクセスできるようにする
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
				// 未定義のプロパティアクセス ≒ 未定義テーブルアクセスに対してエラーを返すと、
				// console.log(client) のような内部でシンボルによるプロパティアクセスを試みるコードでエラーが発生する
				// そのため undefined を返すようにしておく
				// そのそもClientModelsの型定義により未定義のテーブルには型エラーでアクセスできない
				if (!(prop in target)) {
					return undefined;
				}
				return target[prop as keyof typeof target];
			},
		},
	) as ClientModels<TSchema>;
}

