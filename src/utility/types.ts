import { Client } from "discord.js";
import { CommandRegistry } from "./command.js";

export interface Data {
  prefix: string;
  id: string;
  perms: Perms;
  registry: CommandRegistry;
  client: Client;
};

export interface Footers {
  magic8ball: string[];
};

export type PatchNotes = {
  version: string;
  type: string;
  date: string;
  devs: string[];
  notes: string[];
}[];

export interface Perms {
  host: Record<string, string>;
  developer: Record<string, string>;
  contributor: Record<string, string>;
  botTester: Record<string, string>;
};

export interface Options {
  number: Map<string, number | null>;
  boolean: Map<string, boolean | null>;
  string: Map<string, string | null>;
};

export interface Responses {
  magic8ball: (string | {text: string; credit?: string; url?: string; image?: string;})[];
};
