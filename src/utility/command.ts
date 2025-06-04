import {
  SlashCommandBuilder,
  Collection,
  SlashCommandSubcommandBuilder,
  ApplicationCommandOptionType,
  SlashCommandBooleanOption,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
  REST,
  Routes,
} from "discord.js";
import fg from "fast-glob";
import path from "path";
import { CommandContext } from "./context.js";
import { panic, toPosixPath } from "./utility.js";
import { pathToFileURL } from "url";
import { Options } from "./types.js";

export class Command {
  data: SlashCommandBuilder;
  body?:
    | readonly [CommandOption, ...CommandOption[]]
    | readonly [Subcommand, ...Subcommand[]];
  execute?: (ctx: CommandContext, opts: Options) => Promise<void>;

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
          options: readonly [CommandOption, ...CommandOption[]];
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
        }
      | {
          name: string;
          description: string;
          subcommands: readonly [Subcommand, ...Subcommand[]];
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

export class Subcommand {
  data: SlashCommandSubcommandBuilder;
  body?: readonly [CommandOption, ...CommandOption[]];
  execute: (ctx: CommandContext, opts: Options) => Promise<void>;

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
          options: readonly [CommandOption];
          execute: (ctx: CommandContext, opts: Options) => Promise<void>;
        },
  ) {
    this.data = new SlashCommandSubcommandBuilder()
      .setName(args.name)
      .setDescription(args.description);
    this.execute = args.execute;

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
          default:
            panic("Unimplemented data type.");
        }
      }
      this.body = args.options;
    }
  }
}

export class CommandOption {
  data:
    | SlashCommandIntegerOption
    | SlashCommandBooleanOption
    | SlashCommandStringOption;
  type: "number" | "boolean" | "string";

  constructor(args: {
    name: string;
    description: string;
    required?: boolean;
    type: "number" | "boolean" | "string";
  }) {
    this.type = args.type;
    switch (args.type) {
      case "number":
        this.data = new SlashCommandIntegerOption();
        break;
      case "boolean":
        this.data = new SlashCommandBooleanOption();
        break;
      case "string":
        this.data = new SlashCommandStringOption();
        break;
    }

    this.data
      .setName(args.name)
      .setDescription(args.description)
      .setRequired(args.required ?? true);
  }
}

export class CommandRegistry {
  commands: Collection<string, Command>;

  constructor() {
    this.commands = new Collection();
  }

  async detectAll(source: string): Promise<void> {
    const globPattern = toPosixPath(path.join(source, "**/*.{js,ts}"));
    const fileGlob = await fg(globPattern);

    const files = [];
    for (const filePath of fileGlob)
      files.push(await import(pathToFileURL(filePath).href));

    const commands = files
      .map(({ default: command }) => {
        if (!(command instanceof Command)) return null;
        // command: Command
        return [command.data.name, command] as [string, Command];
      })
      .filter((item) => item !== null);

    this.commands = new Collection(commands);
  }

  async registerAll(token: string, id: string): Promise<void> {
    const rest = new REST().setToken(token);

    await rest.put(Routes.applicationCommands(id), {
      body: this.commands.map((command) => command.data),
    });
  }
}

export function isSubcommandArray(
  body:
    | readonly [CommandOption, ...CommandOption[]]
    | readonly [Subcommand, ...Subcommand[]],
): body is readonly [Subcommand, ...Subcommand[]] {
  return body.length > 0 && body[0] instanceof Subcommand;
}

export function isOptionArray(
  body:
    | readonly [CommandOption, ...CommandOption[]]
    | readonly [Subcommand, ...Subcommand[]],
): body is readonly [CommandOption, ...CommandOption[]] {
  return body.length > 0 && body[0] instanceof CommandOption;
}
