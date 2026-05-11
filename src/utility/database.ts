import { DatabaseSync, StatementSync } from "node:sqlite";
import { DatabaseRecord } from "./types.js";

//TODO: support bot-global config

//MARK: Database
export class Database {
  inner: DatabaseSync;
  user: DatabaseTableManager;
  channel: DatabaseTableManager;
  server: DatabaseTableManager;
  global: DatabaseTableManager;

  constructor (path: string) {
    const db = new DatabaseSync(path);
    this.inner = db;

    db.exec(`
      CREATE TABLE IF NOT EXISTS User(
        id TEXT PRIMARY KEY NOT NULL,
        json TEXT DEFAULT '{}'
      ) STRICT;
      CREATE TABLE IF NOT EXISTS Channel(
        id TEXT PRIMARY KEY NOT NULL,
        json TEXT DEFAULT '{}'
      ) STRICT;
      CREATE TABLE IF NOT EXISTS Server(
        id TEXT PRIMARY KEY NOT NULL,
        json TEXT DEFAULT '{}'
      ) STRICT;
      CREATE TABLE IF NOT EXISTS Global(
        id TEXT PRIMARY KEY NOT NULL,
        json TEXT DEFAULT '{}'
      ) STRICT;
    `);

    this.user = new DatabaseTableManager(db, "User");
    this.channel = new DatabaseTableManager(db, "Channel");
    this.server = new DatabaseTableManager(db, "Server");
    this.global = new DatabaseTableManager(db, "Global");
  }

  close(): void {
    this.inner.close();
    console.log("Database connection closed.");
  }
}

export type DatabaseTableName = "User" | "Channel" | "Server" | "Global";

//MARK: TableManager
export class DatabaseTableManager {
  private data: StatementData;
  tableName: DatabaseTableName;

  constructor(
    db: DatabaseSync,
    name: DatabaseTableName,
  ) {
    this.tableName = name;
    this.data = new StatementData(db, name);
  }

  /**
   * Returns the property if it exists in the database, otherwise returns `undefined`.
   */
  fetchOrUndefined(id: string, property: string): Exclude<unknown, undefined> {
    const data = parseDataAsJSON(this.data.fetch.get({id}));

    return data[property];
  }

  /**
   * Returns the property if it exists in the database, otherwise returns the default
   * value provided by `def`.
   */
  fetchOr(id: string, property: string, def: unknown): unknown {
    const data = parseDataAsJSON(this.data.fetch.get({id}));

    if (data[property] === undefined) {
      return def;
    } else if (typeof data[property] !== typeof def && def !== undefined) {
      throw new Error(`Type ${typeof def} of default value is unrelated to database record type ${typeof data}`);
    } else {
      return data[property];
    }
  }

  /**
   * Returns the property if it exists in the database, otherwise returns the default
   * value provided by the `def` closure.
   */
  fetchOrElse(id: string, property: string, def: () => unknown): unknown {
    const data = parseDataAsJSON(this.data.fetch.get({id}));

    if (data[property] === undefined) {
      return def();
    } else {
      return data[property];
    }
  }

  /**
   * Returns the property for all rows in the database, 
   * omitting rows where the property does not exist.
   */
  fetchAll(property: string): unknown[] {
    const dataAll = this.data.fetchUnconstrained.iterate();
    const propertyArray = [];

    for (const row of dataAll) {
      const data = parseDataAsJSON(row);
      if (data[property] !== undefined) {
        propertyArray.push(data[property]);
      }
    }

    return propertyArray;
  }

  /**
   * Returns the property for all rows in the database, using the `def` value for
   * rows that do not exist.
   */
  fetchAllOr(property: string, def: unknown): unknown[] {
    const dataAll = this.data.fetchUnconstrained.iterate();
    const propertyArray = [];

    for (const row of dataAll) {
      const data = parseDataAsJSON(row);
      if (data[property] !== undefined) {
        propertyArray.push(data[property]);
      } else {
        propertyArray.push(def);
      }
    }

    return propertyArray;
  }

  /**
   * Returns a map of the database with ID as the keys and the property as the values,  
   * omitting rows where the property does not exist.
   */
  fetchMap(property: string): Map<string, unknown> {
    const dataAll = this.data.fetchKeyValue.iterate();
    const propertyMap =  new Map<string, unknown>();

    for (const row of dataAll) {
      const data = parseDataAsJSON(row);
      if (!("cast(id as text)" in row) || row["cast(id as text)"] === null)
        throw new Error("Expected id property in database query.");

      if (data[property] !== undefined) {
        propertyMap.set(row["cast(id as text)"].toString(), data[property]);
      }
    }

    return propertyMap;
  }

  /**
   * Updates the value of the property to a new value. Creates the row or the property if necessary.
   */
  update(id: string, property: string, value: unknown): void {
    this.data.createIfNotExists.run({id});

    const data = parseDataAsJSON(this.data.fetch.get({id}));

    if (
      data[property] !== undefined 
      && value !== undefined 
      && typeof data[property] !== typeof value
    ) {
      throw new Error(`Type "${typeof value}" provided to ${this.tableName.toLowerCase()} database property "${property}", when type "${typeof data}" was expected.`);
    }

    data[property] = value;
    
    this.data.update.run({id, json: JSON.stringify(data)});
  }
}

//MARK: StatementData
class StatementData {
  createIfNotExists: StatementSync;
  update: StatementSync;
  fetch: StatementSync;
  fetchUnconstrained: StatementSync;
  fetchKeyValue: StatementSync;

  constructor (
    db: DatabaseSync,
    tableName: string
  ) {
    this.createIfNotExists = db.prepare(`
      INSERT INTO ${tableName} (id)
      VALUES (@id)
      ON CONFLICT DO NOTHING
    `);

    this.update = db.prepare(`
      UPDATE ${tableName}
      SET json = @json
      WHERE (id == @id)
    `);

    this.fetch = db.prepare(`
      SELECT json 
      FROM ${tableName}
      WHERE (id == @id)
      LIMIT 1
    `);

    this.fetchUnconstrained = db.prepare(`
      SELECT json 
      FROM ${tableName}
    `);

    this.fetchKeyValue = db.prepare(`
      SELECT cast(id as text), json 
      FROM ${tableName}
    `);
  }
}

function parseDataAsJSON(data: DatabaseRecord<unknown> | undefined): DatabaseRecord<unknown> {
  if (data === undefined) return {};

  const json = data.json;
  if (json === undefined) return {};

  const parsedJSON: unknown = JSON.parse(json as string);
  // console.log(parsedJSON);

  return parsedJSON as DatabaseRecord<unknown>;
}