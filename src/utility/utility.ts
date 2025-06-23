import path from "path";

/**
 * Brings the program to a complete halt with the provided error message. Avoid
 * using unless critical failure has occured or the program should not proceed.
 */
export function panic(errorMessage = "A fatal error has occured."): never {
  console.error(errorMessage);
  process.exit(1);
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

export class EnsureMap<T> {
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

  constructor() {
    this.inner = new Map();
  }
}
