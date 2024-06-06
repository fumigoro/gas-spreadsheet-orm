# gas-spreadsheet-object-mapper

[English](./README.en.md) | 日本語

[![npm version](https://badge.fury.io/js/%40fumigoro%2Fgas-spreadsheet-object-mapper.svg)](https://badge.fury.io/js/%40fumigoro%2Fgas-spreadsheet-object-mapper)

Google Apps Scriptにて、スプレッドシートに対する型付きのCRUDを実現するパッケージです。

型定義にはTypeScriptの`type`ではなく`class`を使用するため、JavaScriptでも恩恵を受けることができます。

# Usage

## 前提

- claspを導入済みでローカルでGoogleAppsScriptの開発を行う環境がある。
- esbuild等のバンドラーを導入済みでnpmパッケージを使用したコードをビルドできる環境がある。

## スプレッドシートにシートを追加

スプレッドシートに読み書き対象となる表を作成します。

- 1行目に必ずカラム名を記入してください。
- プライマリキーとなるカラム（ユニークな`string`または`number`）を1つ用意する必要があります。

![image](https://github.com/fumigoro/gas-spreadsheet-orm/assets/51395778/260c52d0-a824-4603-9a4e-942e4a600093)

## Install

```shell
npm install @fumigoro/gas-spreadsheet-object-mapper
```

## データのclassを定義

 `@SpreadSheetColumn`デコレーターを使用して、各メンバとスプレッドシート上のカラム名をマッピングします。
 
 - メンバー変数`id`は必ず定義し、プライマリキーとなるスプレッドシートのカラム名とマッピングしてください。`id`の型は`string`または`number`のみ利用できます。
 - カラム名には日本語も使用できます。 
 - スプレッドシート側のカラムの順序とメンバーの定義順序を一致させる必要はありません。

```ts
import { SpreadSheetColumn } from "@fumigoro/gas-spreadsheet-object-mapper";

class User {
  @SpreadSheetColumn('ID')
  id: number;

  @SpreadSheetColumn('Name')
  name: string;

  @SpreadSheetColumn('Age')
  age: number;

  // このようにして、スプレッドシートから値を読み込む際のパース関数や書き込む際のシリアライズ関数を追加することも可能です。
  @SpreadSheetColumn('CreatedAt', {
    parser: (value: any) => new Date(value),
    serializer: (value: any) => value.toISOString()
  })
  createdAt: Date;
}
```

## `SpreadSheetMapper`インスタンスの作成

定義したデータクラスを用いて`SpreadSheetMapper`インスタンスを作成します。

`SpreadSheetMapper`はそのコンストラクタ内で全ての行のデータを読み出してメモリ上に持ちます。

```ts
import { SpreadSheetMapper } from "@fumigoro/gas-spreadsheet-object-mapper";

const spreadSheetId = 'YOUR_SPREADSHEET_ID';
const sheetName = 'Users';
const userSheetMapper = new SpreadSheetMapper(spreadSheetId, sheetName, User);
```

## データのCRUD

### list()

`SpreadSheetMapper`インスタンスがメモリ上に持つ全てのデータを返します。

```ts
const users = userSheetMapper.list();
```

### get()

`SpreadSheetMapper`インスタンスがメモリ上に持つ全てのデータから、idが一致するデータを返します。

```ts
const user = userSheetMapper.get('target_user_id');
```

### updateAndSave()

idが一致する行を更新し、スプレッドシートに書き込みます。
`SpreadSheetMapper`インスタンスがメモリ上にもつデータも更新されます。

```ts
userSheetMapper.updateAndSave({ id: 1, name: 'Jone', age: 36, createdAt: new Date() });
```

### createAndSave()

新しいデータを挿入し、スプレッドシートに書き込みます。

```ts
userSheetMapper.createAndSave({ id: 4, name: 'Bob', age: 10, createdAt: new Date() });
```

### deleteAndSave()

idが一致するデータを削除します。
`SpreadSheetMapper`インスタンスが持つデータとスプレッドシート両方から削除されます。
スプレッドシートにおいても行ごと削除され上に詰められます。

```ts
userSheetMapper.deleteAndSave(4);
```
