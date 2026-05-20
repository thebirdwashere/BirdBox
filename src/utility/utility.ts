import path from "path";
import { CommandContext } from "./context.js";
import config from "@src/data/config.json" with { type: "json" };
import perms from "@src/data/perms.json" with { type: "json" };
import { Config, ConfigScope, Perms } from "./types.js";
import { Database } from "./database.js";

const CONFIG = config as Config;
const PERMS = perms as Perms;

//MARK: General

/**
 * Brings the program to a complete halt with the provided error message. Avoid
 * using unless critical failure has occured or the program should not proceed.
 */
export function panic(errorMessage = "A fatal error has occured."): never {
  console.error(errorMessage);
  process.exit(1);
}

/**
 * Returns the type inferred from context, but errors if actually called.
 * Useful to prevent warnings in partially-finished code.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function TODO<T>(): T {
  throw new Error("Called function TODO with.");
}

/**
 * Converts a Windows-style path to a POSIX-style path.
 */
export function toPosixPath(pathString: string): string {
  return pathString.split(path.sep).join(path.posix.sep);
}

/**
 * Halts execution for the given number of milliseconds. Must be run in an
 * asynchronous context.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tests if a command context is of a subcomamnd.
 */
export function isSubcommand(ctx: CommandContext): boolean {
  return "currentSubcommand" in ctx;
}

/**
 * Returns a random element from the provided array.
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns an array of every ID in perms.json.
 */
export function getAdminIds(): string[] {
  return (Object.values(PERMS) as Record<string, string[]>[])
    .map(item => Object.values(item))
    .flat(2);
}

/**
 * Returns a config option from the database, or the default from config.json if not present.
 */
export function fetchConfigOption<ConfigScopeType extends ConfigScope>(
  db: Database, 
  scope: ConfigScopeType, 
  option: keyof Config[ConfigScopeType], 
  id: string | undefined
): Exclude<unknown, undefined> {
  const setting = CONFIG[scope][option];

  switch (scope) {
  case "user": {
    if (id === undefined)
      throw new Error(`Attempted to get server config option ${setting.name} without a valid ID.`);
    
    const fetchedData = db.user.fetchOr(id, `config_${setting.value}`, setting.default);
    if (fetchedData === "enable" || fetchedData === "disable") {
      return fetchedData === "enable";
    } else {
      return fetchedData;
    }

  } case "server": {
    if (id === undefined)
      throw new Error(`Attempted to get user config option ${setting.name} without a valid ID.`);

    const fetchedData = db.server.fetchOr(id, `config_${setting.value}`, setting.default);
    if (fetchedData === "enable" || fetchedData === "disable") {
      return fetchedData === "enable";
    } else {
      return fetchedData;
    }

  } case "bot": {
    return db.global.fetchOr("global", `config_${setting.value}`, setting.default);
  }
  }
}

/**
 * Map wrapper with various utility methods to ensure values exist or optionally
 * return defaults.
 */
export class EnsureMap<T> { //MARK: EnsureMap
  inner: Map<string, T | null>;

  /**
   * Returns the (nullable) value if it exists, otherwise throws an error.
   */
  fetch(key: string): T | null {
    const inner = this.inner.get(key);
    if (inner === undefined)
      throw new Error(
        `Failed to fetch option ${key} - option was ensured to exist in command.`,
      );
    return inner;
  }

  /**
   * Returns the value if it exists and is non-null, otherwise throws an error.
   */
  fetchNonNull(key: string): T {
    const inner = this.inner.get(key);
    if (inner === undefined || inner === null)
      throw new Error(
        `Failed to fetch option ${key} - option was ensured to have been provided.`,
      );
    return inner;
  }

  /**
   * Returns the (nullable) value if it exists, otherwise returns the default
   * value provided by `def`.
   */
  fetchOr(key: string, def: T): T | null {
    const inner = this.inner.get(key);
    if (inner === undefined) return def;
    return inner;
  }

  /**
   * Returns the (nullable) value if it exists, otherwise returns the default
   * value provided by the `def` closure.
   */
  fetchOrElse(key: string, def: () => T): T | null {
    const inner = this.inner.get(key);
    if (inner === undefined) return def();
    return inner;
  }

  /**
   * Returns the value if it exists and is non-null, otherwise returns the
   * default value provided by `def`.
   */
  fetchNonNullOr(key: string, def: T): T {
    const inner = this.inner.get(key);
    if (inner === undefined || inner === null) return def;
    return inner;
  }

  /**
   * Returns the value if it exists and is non-null, otherwise returns the
   * default value provided by the `def` closure.
   */
  fetchNonNullOrElse(key: string, def: () => T): T {
    const inner = this.inner.get(key);
    if (inner === undefined || inner === null) return def();
    return inner;
  }

  /**
   * Returns the (nullable) value if it exists, otherwise returns `undefined`.
   */
  fetchOrUndefined(key: string): T | null | undefined {
    return this.inner.get(key);
  }

  /**
   * Returns the value if it exists and is non-null, otherwise returns `undefined`.
   */
  fetchNonNullOrUndefined(key: string): T | null | undefined {
    const inner = this.inner.get(key);
    if (inner === null) return undefined;
    return inner;
  }

  constructor() {
    this.inner = new Map();
  }
}
