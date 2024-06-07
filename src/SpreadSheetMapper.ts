/**
 * @description Property decorator to map a class property to a spreadsheet column.
 * @param columnName - The name of the spreadsheet column.
 * @param options.parser - Function to parse the value from the spreadsheet.
 * @param options.serializer - Function to serialize the value to the spreadsheet.
 */
export function SpreadSheetColumn(columnName: string, options: { parser?: (value: any) => any, serializer?: (value: any) => any } = { parser: v => v, serializer: v => v }): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    if (!target.constructor._columns) {
      target.constructor._columns = {};
    }
    target.constructor._columns[propertyKey] = { columnName, parser: options.parser, serializer: options.serializer };
  };
}

function getColumnMappings<T>(target: { new(): T }) {
  // @ts-ignore
  return target._columns || {};
}

interface DataTypeBase {
  id: string | number;
};

export class SpreadSheetMapper<T extends DataTypeBase> {
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private data: T[] = [];
  private headers: string[];
  private propertyToColumnMap: { [P in keyof T]?: { columnName: string, parser: (value: any) => any, serializer: (value: any) => any } };

  constructor(spreadSheetId: string, sheetName: string, target: { new(): T }) {
    const spreadSheet = SpreadsheetApp.openById(spreadSheetId);
    const sheet = spreadSheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet not found');
    }
    this.sheet = sheet;
    this.headers = this.sheet.getDataRange().getValues()[0] as string[];
    this.propertyToColumnMap = getColumnMappings(target);
    this.load();
  }

  private mapRowToObject(row: any[]): T {
    const obj: any = { id: row[0] as string };
    Object.keys(this.propertyToColumnMap).forEach((prop) => {
      const columnInfo = this.propertyToColumnMap[prop as keyof T];
      if (columnInfo) {
        const colIndex = this.headers.indexOf(columnInfo.columnName);
        if (colIndex !== -1) {
          obj[prop] = columnInfo.parser(row[colIndex]);
        }
      }
    });
    return obj as T;
  }

  private mapObjectToRow(obj: T): any[] {
    return this.headers.map((header) => {
      const prop = Object.keys(this.propertyToColumnMap).find(key => this.propertyToColumnMap[key as keyof T]?.columnName === header);
      const columnInfo = this.propertyToColumnMap[prop as keyof T];
      if (columnInfo) {
        return prop ? columnInfo.serializer(obj[prop as keyof T]) : '';
      }
    });
  }

  /**
    * @description Load all rows from the sheet to the class's data member.
    */
  load() {
    const rows = this.sheet.getDataRange().getValues();
    this.data = rows.slice(1).map(row => this.mapRowToObject(row));
  }

  /**
   * @description Return all loaded data. (Accesses the class's data member)
   * @returns The list of loaded data.
   */
  list(): T[] {
    return this.data;
  }

  /**
   * @description Get a data object by its ID. (Accesses the class's data member)
   * @param id - The ID of the data object.
   * @returns The data object if found, otherwise undefined.
   */
  get(id: T['id']): T | undefined {
    return this.data.find(d => d.id === id);
  }

  /**
   * @description Create a new data object and save it to the sheet. (Writes data to the actual spreadsheet)
   * @param newData - The new data object to create and save.
   * @throws {Error} If a data object with the same ID already exists.
   */
  createAndSave(newData: T) {
    if (this.data.some(d => d.id === newData.id)) {
      throw new Error('Duplicated ID');
    }
    this.data.push(newData);
    const values = this.mapObjectToRow(newData);
    this.sheet.appendRow(values);
  }

  /**
  * @description Update an existing data object and save changes to the sheet. (Writes data to the actual spreadsheet)
  * @param newData - The data object to update and save.
  * @throws {Error} If the data object is not found.
  */
  updateAndSave(newData: T) {
    const targetIndex = this.data.findIndex(d => d.id === newData.id);
    if (targetIndex === -1) {
      throw new Error('Not found');
    }
    this.data[targetIndex] = newData;

    const values = this.mapObjectToRow(newData);
    this.sheet.getRange(targetIndex + 2, 1, 1, values.length).setValues([values]);
  }

  /**
  * @description Delete a data object and save changes to the sheet. (Writes data to the actual spreadsheet)
  * @param id - The ID of the data object to delete.
  * @throws {Error} If the data object is not found.
  */
  deleteAndSave(id: T['id']) {
    const targetIndex = this.data.findIndex(d => d.id === id);
    if (targetIndex === -1) {
      throw new Error('Not found');
    }
    this.data.splice(targetIndex, 1);
    this.sheet.deleteRow(targetIndex + 2);
  }
}
