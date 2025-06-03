export interface Perms {
  host: Record<string, number>;
  developer: Record<string, number>;
  contributor: Record<string, number>;
  botTester: Record<string, number>;
}

interface PatchNote {
  version: string,
  type: string,
  date: string,
  devs: string[],
  notes: string[],
}

export type PatchNotes = PatchNote[];