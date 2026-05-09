import { DatabaseSync, StatementSync } from "node:sqlite";

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

  update(id: string, property: string, value: unknown): void;
  fetch(id: string, property: string): unknown;
  fetchOr(id: string, property: string, def: unknown): Exclude<unknown, undefined>;
  parseData(id: string): DatabaseRecord;
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

  update(id: string, property: string, value: unknown): void {
    this.data.createIfNotExists.run({id});

    const data = this.parseData(id);
    //console.log(current[property]);

    if (data[property] !== undefined && typeof data[property] !== typeof value)
      throw new Error(`Type "${typeof value}" provided to ${this.tableName.toLowerCase()} database property "${property}", when type "${typeof data}" was expected.`);
    
    data[property] = value;
    
    this.data.update.run({id, json: JSON.stringify(data)});
  }

  fetch(id: string, property: string): unknown {
    const data = this.parseData(id);
    return data[property];
  }

  fetchOr(id: string, property: string, def: unknown): Exclude<unknown, undefined> {
    const data = this.parseData(id);
    const value = data[property];
    if (value === undefined || value === null) {
      return def;
    } else {
      return value;
    }
  }

  parseData(id: string): DatabaseRecord {
    const databaseFetch = this.data.fetch.get({id});
    const json = databaseFetch?.json;

    if (!json)
      throw new Error(`Unable to fetch existing ${this.tableName.toLowerCase()} data.`);

    const parsedJSON: DatabaseRecord = JSON.parse(json as string) as DatabaseRecord;
    // console.log(parsedJSON);

    return parsedJSON;
  }
}

class StatementData {
  createIfNotExists: StatementSync;
  update: StatementSync;
  fetch: StatementSync;

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
  }
}

type DatabaseRecord = Record<string, unknown>;