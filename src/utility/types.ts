export interface Perms {
  host: Record<string, number>;
  developer: Record<string, number>;
  contributor: Record<string, number>;
  botTester: Record<string, number>;
}
