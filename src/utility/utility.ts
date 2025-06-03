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
