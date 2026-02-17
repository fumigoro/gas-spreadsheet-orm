# gas-spreadsheet-object-mapper

[![npm version](https://badge.fury.io/js/%40fumigoro%2Fgas-spreadsheet-object-mapper.svg)](https://badge.fury.io/js/%40fumigoro%2Fgas-spreadsheet-object-mapper)

**Use Google Spreadsheets as a typed, object-oriented database.**

`gas-spreadsheet-object-mapper` provides a simple ORM-like layer for Google Apps Script, allowing you to perform type-safe CRUD operations on your spreadsheets using TypeScript or JavaScript classes.

---

## ✨ Features

- **Intuitive, Class-Based Models:** Define your data structure using standard TypeScript/JavaScript classes and decorators.
  ```ts
  class User {
    @SpreadSheetColumn('ID')
    id: number;

    @SpreadSheetColumn('Name')
    name: string;
  }
  ```

- **Full CRUD Support:** `create`, `read`, `update`, and `delete` records with simple method calls.
  ```ts
  userSheetMapper.createAndSave({ id: 1, name: 'Bob' });
  const user = userSheetMapper.get(1);
  userSheetMapper.updateAndSave({ id: 1, name: 'John' });
  userSheetMapper.deleteAndSave(1);
  ```

- **Custom Data Parsers:** Easily handle complex data types like `Date` with custom parser and serializer functions.
  ```ts
  @SpreadSheetColumn('CreatedAt', {
    parser: (value: any) => new Date(value),
    serializer: (value: Date) => value.toISOString(),
  })
  createdAt: Date;
  ```

- **Type-Safe Operations:** Enjoy autocompletion and compile-time checks, reducing runtime errors.
- **No Magic, Just Code:** The library is straightforward and easy to reason about.

---

# 🚀 Usage

## Prerequisites

- You use [clasp](https://github.com/google/clasp) and have a local environment for Google Apps Script.
- You have a bundler such as `esbuild` configured to handle npm package dependencies.

## 📝 Prepare the Spreadsheet

Create a sheet in your target spreadsheet.

- The **first row must contain your column headers**.
- You need **one primary key column** with unique `string` or `number` values.

You can freely use Japanese or other non-ASCII characters in column names.

![example sheet](https://github.com/fumigoro/gas-spreadsheet-orm/assets/51395778/260c52d0-a824-4603-9a4e-942e4a600093)

## 📦 Install

```shell
npm install @fumigoro/gas-spreadsheet-object-mapper
```

## 🏛️ Define a Data Class

Map your class properties to spreadsheet columns using the `@SpreadSheetColumn` decorator.

- You must define an `id` property and map it to the primary key column.
- The `id` type must be either `string` or `number`.
- The column order in the sheet doesn't need to match the property order in the class.

```ts
import { SpreadSheetColumn } from "@fumigoro/gas-spreadsheet-object-mapper";

class User {
  @SpreadSheetColumn('ID')
  id: number;

  @SpreadSheetColumn('Name')
  name: string;

  @SpreadSheetColumn('Age')
  age: number;

  // You can also provide parser/serializer functions
  // to transform data between the sheet and your class.
  @SpreadSheetColumn('CreatedAt', {
    parser: (value: any) => new Date(value),
    serializer: (value: Date) => value.toISOString(),
  })
  createdAt: Date;
}
```

## 🏭 Create a `SpreadSheetMapper` Instance

Instantiate `SpreadSheetMapper` with your data class. The constructor reads all rows from the sheet and holds them in memory for fast access.

```ts
import { SpreadSheetMapper } from "@fumigoro/gas-spreadsheet-object-mapper";

const spreadSheetId = 'YOUR_SPREADSHEET_ID';
const sheetName = 'Users';
const userSheetMapper = new SpreadSheetMapper(spreadSheetId, sheetName, User);
```

## 🛠️ CRUD Operations

### `list()`

Returns an array of all records currently held in memory.

```ts
const users = userSheetMapper.list();
```

### `get()`

Fetches a single record by its primary key (`id`).

```ts
const user = userSheetMapper.get(1);
```

### `updateAndSave()`

Updates a record. This writes the changes to the spreadsheet and updates the in-memory cache.

```ts
userSheetMapper.updateAndSave({
  id: 1,
  name: 'John',
  age: 36,
  createdAt: new Date(),
});
```

### `createAndSave()`

Inserts a new record into the spreadsheet and the in-memory cache.

```ts
userSheetMapper.createAndSave({
  id: 4,
  name: 'Bob',
  age: 10,
  createdAt: new Date(),
});
```

### `deleteAndSave()`

Deletes a record by its `id` from both the spreadsheet and the in-memory cache. The row is removed from the sheet, and the rows below are shifted up.

```ts
userSheetMapper.deleteAndSave(4);
```

