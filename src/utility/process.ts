import { ChatInputCommandInteraction, Message } from "discord.js";
import {
  CommandRegistry,
  isOptionArray,
  isSubcommandArray,
} from "./command.js";
import {
  ChatInputCommandInteractionContext,
  MessageContext,
} from "./context.js";
import { Data } from "./types.js";

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
        case "integer":
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
    const options = {
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

      for (const [index, option] of command.body.entries()) {
        const opt = args.at(index);
        switch (option.type) {
          case "integer":
            if (opt !== undefined && !isNaN(parseInt(opt))) {
              options.number.set(option.data.name, parseInt(opt));
            } else if (
              opt !== undefined &&
              opt === "!" &&
              !option.data.required
            ) {
              options.number.set(option.data.name, null);
            } else {
              throw new Error(
                `Argument at position ${String(index)} ` +
                  `is of type ${typeof args.at(index)} ` +
                  `when type ${option.type} was expected.`,
              );
            }
            break;
          case "boolean":
            if (opt !== undefined && (opt === "true" || opt === "false")) {
              options.boolean.set(
                option.data.name,
                opt === "true" ? true : false,
              );
            } else if (
              opt !== undefined &&
              opt === "!" &&
              !option.data.required
            ) {
              options.boolean.set(option.data.name, null);
            } else {
              throw new Error(
                `Argument at position ${String(index)} ` +
                  `is of type ${typeof args.at(index)} ` +
                  `when type ${option.type} was expected.`,
              );
            }
            break;
          case "string":
            if (opt !== undefined && opt !== "!") {
              options.string.set(option.data.name, opt);
            } else if (opt !== undefined && !option.data.required) {
              options.string.set(option.data.name, null);
            } else {
              throw new Error(
                `Argument at position ${String(index)} ` +
                  `is of type ${typeof args.at(index)} ` +
                  `when type ${option.type} was expected.`,
              );
            }
            break;
        }
      }
    }

    // Attempt to execute command.
    await command.execute(context, options);
  } else if (command.body !== undefined && isSubcommandArray(command.body)) {
    const subcommandName = args.shift();
    if (subcommandName === undefined)
      throw new Error(`Subcommand missing in command: \`/${commandName}\``);

    const options = {
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

      for (const [index, option] of subcommand.body.entries()) {
        const opt = args.at(index);
        switch (option.type) {
          case "integer":
            if (opt !== undefined && !isNaN(parseInt(opt))) {
              options.number.set(option.data.name, parseInt(opt));
            } else if (
              opt !== undefined &&
              opt === "!" &&
              !option.data.required
            ) {
              options.number.set(option.data.name, null);
            } else {
              throw new Error(
                `Argument at position ${String(index)} ` +
                  `is of type ${typeof args.at(index)} ` +
                  `when type ${option.type} was expected.`,
              );
            }
            break;
          case "boolean":
            if (opt !== undefined && (opt === "true" || opt === "false")) {
              options.boolean.set(
                option.data.name,
                opt === "true" ? true : false,
              );
            } else if (
              opt !== undefined &&
              opt === "!" &&
              !option.data.required
            ) {
              options.boolean.set(option.data.name, null);
            } else {
              throw new Error(
                `Argument at position ${String(index)} ` +
                  `is of type ${typeof args.at(index)} ` +
                  `when type ${option.type} was expected.`,
              );
            }
            break;
          case "string":
            if (opt !== undefined && opt !== "!") {
              options.string.set(option.data.name, opt);
            } else if (opt !== undefined && !option.data.required) {
              options.string.set(option.data.name, null);
            } else {
              throw new Error(
                `Argument at position ${String(index)} ` +
                  `is of type ${typeof args.at(index)} ` +
                  `when type ${option.type} was expected.`,
              );
            }
            break;
        }
      }
    }

    await subcommand.execute(context, options);
  } else {
    throw new Error(`Missing execute function in command: ${commandName}`);
  }
}
