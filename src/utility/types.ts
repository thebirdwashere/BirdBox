import { Client } from "discord.js";
import { CommandRegistry } from "./command.js";

export interface Perms {
  host: Record<string, number>;
  developer: Record<string, number>;
  contributor: Record<string, number>;
  botTester: Record<string, number>;
}

export interface Data {
  prefix: string;
  perms: Perms;
  registry: CommandRegistry;
  client: Client;
}

export type PatchNotes = {
  version: string;
  type: string;
  date: string;
  devs: string[];
  notes: string[];
}[];

export interface Options {
  number: Map<string, number | null>;
  boolean: Map<string, boolean | null>;
  string: Map<string, string | null>;
}
