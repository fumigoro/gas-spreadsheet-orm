# gas-spreadsheet-object-mapper

English | [日本語](./README.md)

[![npm version](https://badge.fury.io/js/%40fumigoro%2Fgas-spreadsheet-object-mapper.svg)](https://badge.fury.io/js/%40fumigoro%2Fgas-spreadsheet-object-mapper)

This package enables typed CRUD operations on Google Spreadsheets using Google Apps Script.

# Usage

## Prerequisites
- clasp is installed and you have a local development environment for Google Apps Script.
- A bundler like esbuild is installed, allowing you to build code using npm packages.

## Adding a Sheet to the Spreadsheet
Create a table in the spreadsheet to be read and written.

- Ensure to write the column names in the first row.
- You need to add one primary key column (unique `string` or `number`).

![image](https://github.com/fumigoro/gas-spreadsheet-orm/assets/51395778/260c52d0-a824-4603-9a4e-942e4a600093)

## Install

```shell
npm install @fumigoro/gas-spreadsheet-object-mapper
```

## Define data class

Use the `@SpreadSheetColumn` decorator to map each member to the corresponding column name in the spreadsheet.

- The member variable `id` must be defined and mapped to the primary key column in the spreadsheet. The id type can only be `string` or `number`.
- The order of columns in the spreadsheet does not need to match the order of members defined.

```ts
import { SpreadSheetColumn } from "@fumigoro/gas-spreadsheet-object-mapper";

class User {
  @SpreadSheetColumn('ID')
  id: number;

  @SpreadSheetColumn('Name')
  name: string;

  @SpreadSheetColumn('Age')
  age: number;

 // You can also add parsing functions when loading values from the spreadsheet and serialization functions when writing.
  @SpreadSheetColumn('CreatedAt', {
    parser: (value: any) => new Date(value),
    serializer: (value: any) => value.toISOString()
  })
  createdAt: Date;
}
```

Instantiate `SpreadSheetMapper`

Create a `SpreadSheetMapper` instance using the defined data class.

`SpreadSheetMapper` loads all row data into memory in its constructor.

```ts
import { SpreadSheetMapper } from "@fumigoro/gas-spreadsheet-object-mapper";

const spreadSheetId = 'YOUR_SPREADSHEET_ID';
const sheetName = 'Users';
const userSheetMapper = new SpreadSheetMapper(spreadSheetId, sheetName, User);
```

## CRUD operations

### list()

Returns all the data held in memory by the `SpreadSheetMapper` instance.

```ts
const users = userSheetMapper.list();
```

### get()

Returns the data with the matching id from all the data held in memory by the `SpreadSheetMapper` instance.

```ts
const user = userSheetMapper.get('target_user_id');
```

### updateAndSave()

Updates the row with the matching id and writes it to the spreadsheet.
The data held in memory by the `SpreadSheetMapper` instance is also updated.

```ts
userSheetMapper.updateAndSave({ id: 1, name: 'Jone', age: 36, createdAt: new Date() });
```

### createAndSave()

Inserts new data and writes it to the spreadsheet.

```ts
userSheetMapper.createAndSave({ id: 4, name: 'Bob', age: 10, createdAt: new Date() });
```

### deleteAndSave()

Deletes the data with the matching id.
The data is removed from both the SpreadSheetMapper instance and the spreadsheet.
The rows in the spreadsheet are shifted up after deletion.

```ts
userSheetMapper.deleteAndSave(4);
```
