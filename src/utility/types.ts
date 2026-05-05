import { Client } from "discord.js";
import { Registry } from "./registry.js";

export interface Data {
  prefix: string;
  id: string;
  perms: Perms;
  registry: Registry;
  client: Client;
};

export interface Flags {
  emojis: Record<string, {
    emoji: string;
    decoys: string[];
  }>;
  difficulties: {
    name: string;
    flags: number;
    earned: number;
    lost: number;
    decoysAmount: number;
  }[];
};

export interface Footers {
  magic8ball: string[];
  help: string[];
};

export type Keywords = Record<string, string>;

export type Languages = {
  value: string;
  name: string;
}[];

export type PatchNotes = {
  version: string;
  type: string;
  date: string;
  devs: string[];
  contribs?: string[];
  notes: string[];
}[];

export type PeriodicTable = {
  ones: string[];
  twos: string[];
  impossible_endings: string[];
}

export interface Perms {
  host: Record<string, string>;
  developer: Record<string, string>;
  contributor: Record<string, string>;
  botTester: Record<string, string>;
};

export type ResponsesList = string[];

export interface Options {
  number: Map<string, number | null>;
  boolean: Map<string, boolean | null>;
  string: Map<string, string | null>;
};

export type EightBallResponses = (string | {text: string; credit?: string; url?: string; image?: string;})[];