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
  ContextMenuCommandBuilder,
  ApplicationCommandType,
} from "discord.js";
import { CommandContext, AutocompleteContext } from "./context.js";
import { panic } from "./utility.js";
import { NonEmptyArray, Perms, PermsRank } from "./types.js";

//MARK: Command
export class Command {
  data: SlashCommandBuilder;
  body?:
    | Readonly<NonEmptyArray<CommandOption>>
    | Readonly<NonEmptyArray<Subcommand>>;
  execute?: (ctx: CommandContext, opts: Options) => Promise<void>;
  autocomplete?: (ctx: AutocompleteContext) => Promise<void>;
  permissions?: PermsRank[];
  contextmenu?: ContextMenuData;

  constructor(
    args:
      | {
          name: string;
          description: string;
          permissions?: PermsRank[];
          contextmenu?: Omit<ContextMenuData, "data">
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
        }
      | {
          name: string;
          description: string;
          options: Readonly<NonEmptyArray<CommandOption>>;
          permissions?: PermsRank[];
          contextmenu?: Omit<ContextMenuData, "data">
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
          autocomplete?: (ctx: AutocompleteContext) => Promise<void>;
        }
      | {
          name: string;
          description: string;
          subcommands: Readonly<NonEmptyArray<Subcommand>>;
        },
  ) {
    this.data = new SlashCommandBuilder()
      .setName(args.name)
      .setDescription(args.description);

    if ("execute" in args) this.execute = args.execute;
    if ("autocomplete" in args) this.autocomplete = args.autocomplete;
    if ("permissions" in args) this.permissions = args.permissions;

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

    if ("contextmenu" in args && args.contextmenu) {
      const menuData = new ContextMenuCommandBuilder()
        .setName(args.contextmenu.label);

      switch (args.contextmenu.type) {
      case "message": {
        menuData.setType(ApplicationCommandType.Message);
        break;
      } case "user": {
        menuData.setType(ApplicationCommandType.User);
        break;
      }
      }

      this.contextmenu = {
        data: menuData,
        label: args.contextmenu.label,
        type: args.contextmenu.type,
        contextOption: args.contextmenu.contextOption,
      };
    }
  }
}

//MARK: Subcommand
export class Subcommand {
  data: SlashCommandSubcommandBuilder;
  body?: Readonly<NonEmptyArray<CommandOption>>;
  permissions?: PermsRank[];
  contextmenu?: ContextMenuData;
  execute: (ctx: CommandContext, opts: Options) => Promise<void>;
  autocomplete?: (ctx: AutocompleteContext) => Promise<void>;

  constructor(
    args:
      | {
          name: string;
          description: string;
          permissions?: PermsRank[];
          contextmenu?: Omit<ContextMenuData, "data">;
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
        }
      | {
          name: string;
          description: string;
          options: Readonly<NonEmptyArray<CommandOption>>;
          contextmenu?: Omit<ContextMenuData, "data">;
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
          autocomplete?: (ctx: AutocompleteContext) => Promise<void>;
        },
  ) {
    this.data = new SlashCommandSubcommandBuilder()
      .setName(args.name)
      .setDescription(args.description);
    this.execute = args.execute;
    if ("autocomplete" in args) this.autocomplete = args.autocomplete;
    if ("permissions" in args) this.permissions = args.permissions;

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

    if ("contextmenu" in args && args.contextmenu) {
      const menuData = new ContextMenuCommandBuilder()
        .setName(args.contextmenu.label);

      switch (args.contextmenu.type) {
      case "message": {
        menuData.setType(ApplicationCommandType.Message);
        break;
      } case "user": {
        menuData.setType(ApplicationCommandType.User);
        break;
      }
      }

      this.contextmenu = {
        data: menuData,
        label: args.contextmenu.label,
        type: args.contextmenu.type,
        contextOption: args.contextmenu.contextOption,
      };
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
  choices?: Readonly<NonEmptyArray<string>>;
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
export interface ContextMenuData {
  data: ContextMenuCommandBuilder;
  label: string;
  type: "message" | "user";
  contextOption?: string;
}

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
    | Readonly<NonEmptyArray<CommandOption>>
    | Readonly<NonEmptyArray<Subcommand>>,
): body is Readonly<NonEmptyArray<Subcommand>> {
  return body.length > 0 && body[0] instanceof Subcommand;
}

export function isOptionArray(
  body:
    | Readonly<NonEmptyArray<CommandOption>>
    | Readonly<NonEmptyArray<Subcommand>>,
): body is Readonly<NonEmptyArray<CommandOption>> {
  return body.length > 0 && body[0] instanceof CommandOption;
}

export function testUserPermissions(ranks: PermsRank[], perms: Perms, id: string): void {
  const permittedIds = Object.entries(perms)
    .filter(([rank]) => ranks.includes(rank as PermsRank))
    .map(([_, ids]) => Object.values(ids as Record<string, string>))
    .flat(2);

  if (!(permittedIds.includes(id))) {
    const optionsFormatter = new Intl.ListFormat("en", {type: "disjunction"});
    const choicesList = optionsFormatter.format(ranks.map(choice => `\`${choice}\``));

    throw new Error(`Sorry, you lack the permissions to use this command. Your rank must be ${choicesList}.`);
  }
}
