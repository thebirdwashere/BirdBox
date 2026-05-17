import { Client } from "discord.js";
import { Registry } from "./registry.js";
import { Database } from "./database.js";


//MARK: Basic
export type NonEmptyArray<T> = [T, ...T[]];

export interface NameValueObject {
  name: string, 
  value: string
};

//MARK: Config
export type ConfigScope = "user" | "server" | "bot";

export type Config = Record<ConfigScope, Record<string, ConfigOptions>>;

export type ConfigOptions = {
  name: string;
  desc: string;
  value: string;
  displayOptionsAs: "toggle";
  default: "enable" | "disable";
} | {
  name: string;
  desc: string;
  value: string;
  displayOptionsAs: "channel" | "user" | "role" | "mentionable";
  default: string | null;
} | {
  name: string;
  desc: string;
  value: string;
  displayOptionsAs: "buttons" | "select";
  options: NameValueObject[];
  default: string | null;
} | {
  name: string;
  desc: string;
  value: string;
  displayOptionsAs: "modal";
  default: string | null;
  options: {
    name: string;
    type: string;
    placeholder: string;
    value: string;
  };
}

//MARK: Data
export interface Data {
  prefix: string;
  id: string;
  perms: Perms;
  registry: Registry;
  client: Client;
  db: Database;
  devMode: boolean;
};

//MARK: Flags
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

//MARK: Perms
export type PermsRank = "host" | "developer" | "contributor" | "tester";

export interface Perms {
  host: Record<string, string>;
  developer: Record<string, string>;
  contributor: Record<string, string>;
  tester: Record<string, string>;
};

//MARK: Quotes
export interface QuoteData {
  text: string;
  username: string;
  userid: string;
  date: string;
}

//MARK: Scratchpad
export interface ScratchpadNoteData {
  label: string;
  text: string;
  timestamp: number;
}

//MARK: Snipes
export interface SnipedMessage {
  authorID: string,
  timestamp: number,
  content: string,
  imageURL: string | undefined,
}

//MARK: Wordle
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


//MARK: Misc JSON
export type EightBallResponses = (string | {
  text: string; 
  credit?: string; 
  url?: string; 
  image?: string;
})[];

export interface Footers {
  magic8ball: string[];
  help: string[];
  snipe: string[];
  quotes: string[];
  tictactoe: {
    start: string[];
    early: string[];
    late: string[];
    win: string[];
    nowin: string[];
  },
  interjections: {
    generic: string[];
    alphabetical: string[];
    periodic: string[];
    pangrams: string[];
    palindromes: string[];
  }
};

export type Keywords = Record<string, string>;

export type Languages = {
  value: string;
  name: string;
}[];

export type Lyrics = string[][];

export interface MaybepileEntry {
  title: string;
  description: string;
  suggester: string;
  claim: {
    status: "claimed";
    user: string;
    id: string;
  } | {
    status: "in development";
    user: string;
    id: string;
  } | {
    status: "deprioritized";
  } | {
    status: "unclaimed";
  }
}

export type MaybepileArray = ["Table of Contents", ...MaybepileEntry[]]

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

export type ResponsesList = string[];