import { Client } from "discord.js";
import { Registry } from "./registry.js";
import { Database } from "./database.js";

export type NonEmptyArray<T> = [T, ...T[]];
export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

export interface Data {
  prefix: string;
  id: string;
  perms: Perms;
  registry: Registry;
  client: Client;
  db: Database;
};

export type DatabaseRecord<T> = Record<string, T>

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

export interface UserFlagStats {
  wins: number,
  losses: number,
  currentStreak: number,
  bestStreak: number,
  points: number,
}

export interface Footers {
  magic8ball: string[];
  help: string[];
  snipe: string[];
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

export interface PeriodicTable {
  ones: string[];
  twos: string[];
  impossibleStrings: string[],
  impossibleEndings: string[];
}

export interface Perms {
  host: Record<string, string>;
  developer: Record<string, string>;
  contributor: Record<string, string>;
  botTester: Record<string, string>;
};

export type ResponsesList = string[];

export interface SnipedMessage {
  authorID: string,
  timestamp: number,
  content: string,
  imageURL: string | null,
}

export type EightBallResponses = (string | {
  text: string; 
  credit?: string; 
  url?: string; 
  image?: string;
})[];

export interface Wordle {
  "extras": string[],
  "guesses": string[],
  "solutions": string[],
}

export type WordleGameFields = { boxes: string[]; word: string; }[];

export interface WordleGameData {
  solution: string, 
  guesses: number,
  fields: WordleGameFields,
  usedCode: boolean,
}

export type WordleGuessNum = | "1" | "2" | "3" | "4" | "5" | "6" | "loss";

export interface UserWordleStats {
  guessStats: Record<WordleGuessNum, number>, 
  currentStreak: number,
  bestStreak: number,
}