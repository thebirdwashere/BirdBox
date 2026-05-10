import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  ApplicationCommandOptionType,
  SlashCommandBooleanOption,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
  SlashCommandUserOption,
  User,
  Role,
  SlashCommandRoleOption,
  SlashCommandMentionableOption,
  SlashCommandChannelOption,
  APIRole,
  GuildMember,
  APIInteractionDataResolvedGuildMember,
  BaseChannel,
  APIInteractionDataResolvedChannelBase,
  ChannelType,
  Channel,
  APIApplicationCommandOptionChoice,
} from "discord.js";
import { CommandContext, AutocompleteContext } from "./context.js";
import { panic } from "./utility.js";
import { NonEmptyArray, NonEmptyReadonlyArray } from "./types.js";

//MARK: Command
export class Command {
  data: SlashCommandBuilder;
  body?:
    | NonEmptyReadonlyArray<CommandOption>
    | NonEmptyReadonlyArray<Subcommand>;
  execute?: (ctx: CommandContext, opts: Options) => Promise<void>;
  autocomplete?: (ctx: AutocompleteContext) => Promise<void>;

  constructor(
    args:
      | {
          name: string;
          description: string;
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
        }
      | {
          name: string;
          description: string;
          options: NonEmptyReadonlyArray<CommandOption>;
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
        }
      | {
          name: string;
          description: string;
          subcommands: NonEmptyReadonlyArray<Subcommand>;
        },
  ) {
    this.data = new SlashCommandBuilder()
      .setName(args.name)
      .setDescription(args.description);

    if ("options" in args) {
      for (const option of args.options) {
        switch (option.data.type) {
        case ApplicationCommandOptionType.Integer:
          this.data.addIntegerOption(option.data);
          break;
        case ApplicationCommandOptionType.Boolean:
          this.data.addBooleanOption(option.data);
          break;
        case ApplicationCommandOptionType.String:
          this.data.addStringOption(option.data);
          break;
        case ApplicationCommandOptionType.User:
          this.data.addUserOption(option.data);
          break;
        case ApplicationCommandOptionType.Role:
          this.data.addRoleOption(option.data);
          break;
        case ApplicationCommandOptionType.Mentionable:
          this.data.addMentionableOption(option.data);
          break;
        case ApplicationCommandOptionType.Channel:
          this.data.addChannelOption(option.data);
          break;
        default:
          panic("Unimplemented data type.");
        }
      }
      this.body = args.options;
    }

    if ("subcommands" in args) {
      for (const subcommand of args.subcommands) {
        this.data.addSubcommand(subcommand.data);
      }
      this.body = args.subcommands;
    }

    if ("execute" in args) this.execute = args.execute;
  }
}

//MARK: Subcommand
export class Subcommand {
  data: SlashCommandSubcommandBuilder;
  body?: NonEmptyReadonlyArray<CommandOption>;
  execute: (ctx: CommandContext, opts: Options) => Promise<void>;
  autocomplete?: (ctx: AutocompleteContext) => Promise<void>;

  constructor(
    args:
      | {
          name: string;
          description: string;
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
        }
      | {
          name: string;
          description: string;
          options: NonEmptyReadonlyArray<CommandOption>;
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
          autocomplete?: (ctx: AutocompleteContext) => Promise<void>;
        },
  ) {
    this.data = new SlashCommandSubcommandBuilder()
      .setName(args.name)
      .setDescription(args.description);
    this.execute = args.execute;
    if ("autocomplete" in args) this.autocomplete = args.autocomplete;

    if ("options" in args) {
      for (const option of args.options) {
        switch (option.data.type) {
        case ApplicationCommandOptionType.Integer:
          this.data.addIntegerOption(option.data);
          break;
        case ApplicationCommandOptionType.Boolean:
          this.data.addBooleanOption(option.data);
          break;
        case ApplicationCommandOptionType.String:
          this.data.addStringOption(option.data);
          break;
        case ApplicationCommandOptionType.User:
          this.data.addUserOption(option.data);
          break;
        case ApplicationCommandOptionType.Role:
          this.data.addRoleOption(option.data);
          break;
        case ApplicationCommandOptionType.Mentionable:
          this.data.addMentionableOption(option.data);
          break;
        case ApplicationCommandOptionType.Channel:
          this.data.addChannelOption(option.data);
          break;
        default:
          panic("Unimplemented data type.");
        }
      }
      this.body = args.options;
    }
  }
}

//MARK: CommandOption
export type CommandOptionType = "number" | "boolean" | "string" 
| "user" | "role" | "mentionable" | "channel";

export class CommandOption {
  data:
    | SlashCommandIntegerOption
    | SlashCommandBooleanOption
    | SlashCommandStringOption
    | SlashCommandUserOption
    | SlashCommandRoleOption
    | SlashCommandMentionableOption
    | SlashCommandChannelOption;
  type: CommandOptionType;
  autocomplete?: true;
  choices?: NonEmptyReadonlyArray<string>;
  length?: readonly [number, number];

  constructor(args: 
    {
      name: string;
      description: string;
      optional?: true;
      type: Exclude<CommandOptionType, "string">;
      autocomplete?: true;
    } | {
      name: string;
      description: string;
      optional?: true;
      type: "string";
      autocomplete?: true;
      choices?: NonEmptyArray<string> 
      | NonEmptyArray<APIApplicationCommandOptionChoice>;
      length?: [number, number];
    }
  ) {
    this.type = args.type;
    switch (args.type) {
    case "string": {
      this.data = new SlashCommandStringOption();
      if (args.autocomplete) this.data.setAutocomplete(args.autocomplete);

      if (args.length) {
        this.length = args.length;
        this.data.setMinLength(args.length[0]);
        this.data.setMaxLength(args.length[1]);
      }

      if (args.choices) {
        if (typeof args.choices[0] === "string") {
          const formattedArgs = args.choices.map(item => {return {name: item, value: item};}) as APIApplicationCommandOptionChoice<string>[];
          this.data.setChoices(formattedArgs);
          this.choices = args.choices as NonEmptyArray<string>;
        } else {
          this.data.setChoices(args.choices as APIApplicationCommandOptionChoice<string>[]);
          this.choices = (args.choices as APIApplicationCommandOptionChoice<string>[]).map(item => item.value) as NonEmptyArray<string>;
        }
      }
      break;
    }
    case "number":
      this.data = new SlashCommandIntegerOption();
      break;
    case "boolean":
      this.data = new SlashCommandBooleanOption();
      break;
    case "user":
      this.data = new SlashCommandUserOption();
      break;
    case "role":
      this.data = new SlashCommandRoleOption();
      break;
    case "mentionable":
      this.data = new SlashCommandMentionableOption();
      break;
    case "channel":
      this.data = new SlashCommandChannelOption();
      break;
    }
    
    this.data
      .setName(args.name)
      .setDescription(args.description)
      .setRequired(!(args.optional ?? false));
  }
}

//MARK: Utils
export class Options {
  number: Map<string, number | null>;
  boolean: Map<string, boolean | null>;
  string: Map<string, string | null>;
  user: Map<string, User | null>;
  role: Map<string, Role | APIRole | null>;
  mentionable: Map<string, User | Role | APIRole | GuildMember | APIInteractionDataResolvedGuildMember | null>;
  channel: Map<string, Channel | BaseChannel | APIInteractionDataResolvedChannelBase<ChannelType> | null>;

  constructor() {
    this.number = new Map<string, number | null>();
    this.boolean = new Map<string, boolean | null>();
    this.string = new Map<string, string | null>();
    this.user = new Map<string, User | null>();
    this.role = new Map<string, Role | APIRole | null>();
    this.mentionable = new Map<string, User | Role | APIRole | GuildMember | APIInteractionDataResolvedGuildMember | null>();
    this.channel = new Map<string, Channel | BaseChannel | APIInteractionDataResolvedChannelBase<ChannelType> | null>();
  }
};

export function isSubcommandArray(
  body:
    | NonEmptyReadonlyArray<CommandOption>
    | NonEmptyReadonlyArray<Subcommand>,
): body is NonEmptyReadonlyArray<Subcommand> {
  return body.length > 0 && body[0] instanceof Subcommand;
}

export function isOptionArray(
  body:
    | NonEmptyReadonlyArray<CommandOption>
    | NonEmptyReadonlyArray<Subcommand>,
): body is NonEmptyReadonlyArray<CommandOption> {
  return body.length > 0 && body[0] instanceof CommandOption;
}
