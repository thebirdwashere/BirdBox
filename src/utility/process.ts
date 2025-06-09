import { ChatInputCommandInteraction, Message } from "discord.js";
import {
  CommandOption,
  CommandRegistry,
  isOptionArray,
  isSubcommandArray,
} from "./command.js";
import {
  ChatInputCommandInteractionContext,
  MessageContext,
} from "./context.js";
import { Data, Options } from "./types.js";

export async function detectChatInputInteractionCommand(
  registry: CommandRegistry,
  data: Data,
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const commandName = interaction.commandName;

  // Determine if command exists in registry.
  const command = registry.commands.get(commandName);
  if (command === undefined)
    throw new Error(`Unknown or unregistered command: \`/${commandName}\``);
  // command: Command

  // Determine passed command options.
  const options = {
    number: new Map<string, number | null>(),
    boolean: new Map<string, boolean | null>(),
    string: new Map<string, string | null>(),
  };

  if (command.body !== undefined && isOptionArray(command.body))
    for (const option of command.body)
      switch (option.type) {
        case "number":
          {
            const opt = interaction.options.getInteger(
              option.data.name,
              option.data.required,
            );

            if (opt === null && option.data.required)
              throw new Error(
                `Required option missing: \`${option.data.name}\``,
              );

            options.number.set(option.data.name, opt);
          }
          break;
        case "boolean":
          {
            const opt = interaction.options.getBoolean(
              option.data.name,
              option.data.required,
            );

            if (opt === null && option.data.required)
              throw new Error(
                `Required option missing: \`${option.data.name}\``,
              );

            options.boolean.set(option.data.name, opt);
          }
          break;
        case "string":
          {
            const opt = interaction.options.getString(
              option.data.name,
              option.data.required,
            );
            if (opt === null && option.data.required)
              throw new Error(
                `Required option missing: \`${option.data.name}\``,
              );

            options.string.set(option.data.name, opt);
          }
          break;
      }

  const context = new ChatInputCommandInteractionContext(interaction, data);

  // Handle commands accordingly.
  if (command.execute !== undefined) {
    // Attempt to execute command.
    await command.execute(context, options);
  } else if (command.body !== undefined && isSubcommandArray(command.body)) {
    const subcommandName = interaction.options.getSubcommand();

    // Attempt to find and execute subcommand.
    const subcommand = command.body.find(
      (sub) => sub.data.name === subcommandName,
    );
    if (subcommand === undefined)
      throw new Error(
        `Unknown subcommand: \`/${commandName} ${subcommandName}\``,
      );

    await subcommand.execute(context, options);
  } else {
    throw new Error(`Missing execute function in command: \`${commandName}\``);
  }
}

export async function detectMessageCommand(
  registry: CommandRegistry,
  data: Data,
  message: Message,
): Promise<void> {
  if (message.content.length === 0) return;
  if (!message.content.startsWith(data.prefix)) return;

  // Split arguments and extract command name.
  const args = message.content.split(/\s/).filter((str) => str.length !== 0);

  // Unify arguments delimited by quotation marks.
  for (let i = 0; i < args.length - 1; i++) {
    if (/^".*/.exec(args[i]) && /.*"$/.exec(args[i + 1])) {
      args[i] = args[i].concat(" ", args[i + 1]);
      args.splice(i + 1, 1);
      args[i] = args[i].substring(1, args[i].length - 1);
    }
  }

  const commandName = args.shift()?.slice(data.prefix.length);
  if (commandName === undefined) return;
  // commandName: string

  // Determine if command exists in registry.
  const command = registry.commands.get(commandName);
  if (command === undefined)
    throw new Error(`Unknown or unregistered command: \`/${commandName}\``);
  // command: Command

  const context = new MessageContext(message, data);

  // Handle commands accordingly.
  if (command.execute !== undefined) {
    let options = {
      number: new Map<string, number | null>(),
      boolean: new Map<string, boolean | null>(),
      string: new Map<string, string | null>(),
    };

    // Populate options if they exist.
    if (command.body !== undefined && isOptionArray(command.body)) {
      if (args.length !== command.body.length)
        throw new Error(
          "Incorrect number of arguments in command: " +
            `\`/${commandName}\`; ` +
            `expected ${String(command.body.length)}, ` +
            `found ${String(args.length)}.`,
        );
      options = populateMessageOptions(args, command.body);
    }

    // Attempt to execute command.
    await command.execute(context, options);
  } else if (command.body !== undefined && isSubcommandArray(command.body)) {
    const subcommandName = args.shift();
    if (subcommandName === undefined)
      throw new Error(`Subcommand missing in command: \`/${commandName}\``);

    let options = {
      number: new Map<string, number | null>(),
      boolean: new Map<string, boolean | null>(),
      string: new Map<string, string | null>(),
    };

    // Attempt to find and execute subcommand.
    const subcommand = command.body.find(
      (sub) => sub.data.name === subcommandName,
    );
    if (subcommand === undefined)
      throw new Error(
        `Unknown subcommand: \`/${commandName} ${subcommandName}\``,
      );

    // Populate options if they exist.
    if (subcommand.body !== undefined && isOptionArray(subcommand.body)) {
      if (args.length !== subcommand.body.length)
        throw new Error(
          "Incorrect number of arguments in command: " +
            `\`/${commandName} ${subcommandName}\`; ` +
            `expected ${String(command.body.length)}, ` +
            `found ${String(args.length)}.`,
        );
      options = populateMessageOptions(args, subcommand.body);
    }

    await subcommand.execute(context, options);
  } else {
    throw new Error(`Missing execute function in command: ${commandName}`);
  }
}

function populateMessageOptions(
  sources: string[],
  targets: readonly [CommandOption, ...CommandOption[]],
): Options {
  const options = {
    number: new Map<string, number | null>(),
    boolean: new Map<string, boolean | null>(),
    string: new Map<string, string | null>(),
  };

  for (const [index, option] of targets.entries()) {
    let sourceType: "optional" | "number" | "boolean" | "string";
    const targetType = option.type;

    const source = sources[index];

    if (source === "!") {
      sourceType = "optional";
    } else if (!isNaN(Number(sources.at(index)))) {
      sourceType = "number";
    } else if (source === "true" || source === "false") {
      sourceType = "boolean";
    } else {
      sourceType = "string";
    }

    if (sourceType !== targetType && sourceType !== "optional") {
      throw new Error(
        `Argument at position ${String(index)} ` +
          `is of type \`${sourceType}\` ` +
          `when type \`${targetType}\` was expected.`,
      );
    }

    switch (sourceType) {
      case "number":
        options.number.set(option.data.name, Number(source));
        break;
      case "boolean":
        options.boolean.set(option.data.name, source === "true" ? true : false);
        break;
      case "string":
        options.string.set(option.data.name, source);
        break;
      case "optional":
        if (!option.data.required) {
          switch (option.type) {
            case "number":
              options.number.set(option.data.name, null);
              break;
            case "boolean":
              options.boolean.set(option.data.name, null);
              break;
            case "string":
              options.string.set(option.data.name, null);
              break;
          }
        } else {
          throw new Error(
            `Argument at position ${String(index)} is not optional.`,
          );
        }
        break;
    }
  }

  return options;
}
