import { DatabaseSync, StatementSync } from "node:sqlite";
import { DatabaseRecord } from "./types.js";

//TODO: support bot-global config

export class Database {
  inner: DatabaseSync;
  user: TableManager;
  channel: TableManager;
  server: TableManager;

  constructor (path: string) {
    const db = new DatabaseSync(path);
    this.inner = db;

    db.exec(`
      CREATE TABLE IF NOT EXISTS User(
        id INTEGER PRIMARY KEY NOT NULL,
        json TEXT DEFAULT '{}'
      ) STRICT;
      CREATE TABLE IF NOT EXISTS Channel(
        id INTEGER PRIMARY KEY NOT NULL,
        json TEXT DEFAULT '{}'
      ) STRICT;
      CREATE TABLE IF NOT EXISTS Server(
        id INTEGER PRIMARY KEY NOT NULL,
        json TEXT DEFAULT '{}'
      ) STRICT;
      CREATE TABLE IF NOT EXISTS Global(
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      ) STRICT;
    `);

    this.user = new TableManager(db, "User");
    this.channel = new TableManager(db, "Channel");
    this.server = new TableManager(db, "Server");
  }

  close(): void {
    this.inner.close();
    console.log("Database connection closed.");
  }
}

interface BaseTableManager {
  data: StatementData;
  tableName: string;

  fetchOrUndefined(id: string, property: string): Exclude<unknown, undefined>;
  fetchOr(id: string, property: string, def: unknown): Exclude<unknown, undefined>;
  fetchOrElse(id: string, property: string, def: () => unknown): Exclude<unknown, undefined>;
  update(id: string, property: string, value: unknown): void;
}

class TableManager implements BaseTableManager {
  data: StatementData;
  tableName: string;

  constructor(
    db: DatabaseSync,
    name: string,
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
  fetchOr(id: string, property: string, def: unknown): Exclude<unknown, undefined> {
    const data = parseDataAsJSON(this.data.fetch.get({id}));

    if (data[property] === undefined) {
      return def;
    } else {
      return data[property];
    }
  }

  /**
   * Returns the property if it exists in the database, otherwise returns the default
   * value provided by the `def` closure.
   */
  fetchOrElse(id: string, property: string, def: () => unknown): Exclude<unknown, undefined> {
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
   * Updates the value of the property to a new value. Creates the row or the property if necessary.
   */
  update(id: string, property: string, value: unknown): void {
    this.data.createIfNotExists.run({id});

    const data = parseDataAsJSON(this.data.fetch.get({id}));

    if (data[property] !== undefined && typeof data[property] !== typeof value)
      throw new Error(`Type "${typeof value}" provided to ${this.tableName.toLowerCase()} database property "${property}", when type "${typeof data}" was expected.`);
    
    data[property] = value;
    
    this.data.update.run({id, json: JSON.stringify(data)});
  }
}

class StatementData {
  createIfNotExists: StatementSync;
  update: StatementSync;
  fetch: StatementSync;
  fetchUnconstrained: StatementSync;

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
  }
}

function parseDataAsJSON(data: DatabaseRecord | undefined): DatabaseRecord {
  if (data === undefined) return {};

  const json = data.json;
  if (json === undefined) return {};

  const parsedJSON: unknown = JSON.parse(json as string);
  // console.log(parsedJSON);

  return parsedJSON as DatabaseRecord;
}