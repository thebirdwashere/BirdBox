import { AutocompleteInteraction, Channel, ChatInputCommandInteraction, Message, Role, User } from "discord.js";
import {
  CommandOption,
  isOptionArray,
  isSubcommandArray,
  Command,
  Subcommand,
  CommandOptionType,
  Options,
} from "./command.js";
import {
  ChatInputCommandInteractionContext,
  ChatInputCommandInteractionSubcommandContext,
  MessageContext,
  MessageSubcommandContext,
  AutocompleteContext
} from "./context.js";
import { Registry } from "./registry.js";
import { Data, NonEmptyReadonlyArray } from "./types.js";
import { sleep } from "./utility.js";

//MARK: ChatInput
export async function detectChatInputInteractionCommand(
  data: Data,
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const commandName = interaction.commandName;

  // Determine if command exists in registry.
  const command = data.registry.commands.get(commandName);
  if (command === undefined)
    throw new Error(`Unknown or unregistered command \`/${commandName}\``);

  // Determine passed command options.
  let options = new Options();

  if (command.body !== undefined && isOptionArray(command.body)) {
    options = parseCommandOptions(command, interaction, options);

    const context = new ChatInputCommandInteractionContext(interaction, data);

    // Handle commands accordingly.
    if (command.execute !== undefined) {
      // Attempt to execute command.
      await command.execute(context, options);
    }
  } else if (command.body !== undefined && isSubcommandArray(command.body)) {
    const subcommandName = interaction.options.getSubcommand();

    // Attempt to find and execute subcommand.
    const subcommand = command.body.find(
      (sub) => sub.data.name === subcommandName,
    );
    if (subcommand === undefined) {
      throw new Error(
        `Unknown subcommand: \`/${commandName} ${subcommandName}\``,
      );
    }

    if (subcommand.body !== undefined && isOptionArray(subcommand.body)) {
      options = parseCommandOptions(subcommand, interaction, options);
    }

    const context = new ChatInputCommandInteractionSubcommandContext(interaction, data, subcommandName, commandName);

    await subcommand.execute(context, options);
  } else if (command.execute !== undefined) {
    const context = new ChatInputCommandInteractionContext(interaction, data);

    await command.execute(context, options);
  } else {
    throw new Error(`Missing execute function in command \`${commandName}\``);
  }
}

//MARK: ChatInput Options
function parseCommandOptions(
  command: Command | Subcommand,
  interaction: ChatInputCommandInteraction,
  options: Options,
): Options {

  if (!command.body || !isOptionArray(command.body)) throw new Error(`parseCommandOptions function used incorrectly to parse command \`${command.data.name}\``);

  for (const option of command.body) {
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
    case "user":
      {
        const opt = interaction.options.getUser(
          option.data.name,
          option.data.required,
        );
        if (opt === null && option.data.required)
          throw new Error(
            `Required option missing: \`${option.data.name}\``,
          );

        options.user.set(option.data.name, opt);
      }
      break;
    case "role":
      {
        const opt = interaction.options.getRole(
          option.data.name,
          option.data.required,
        );
        if (opt === null && option.data.required)
          throw new Error(
            `Required option missing: \`${option.data.name}\``,
          );

        options.role.set(option.data.name, opt);
      }
      break;
    case "mentionable":
      {
        const opt = interaction.options.getMentionable(
          option.data.name,
          option.data.required,
        );
        if (opt === null && option.data.required) 
          throw new Error(
            `Required option missing: \`${option.data.name}\``,
          );

        options.mentionable.set(option.data.name, opt);
      }
      break;
    case "channel":
      {
        const opt = interaction.options.getChannel(
          option.data.name,
          option.data.required,
        );
        if (opt === null && option.data.required) 
          throw new Error(
            `Required option missing: \`${option.data.name}\``,
          );

        options.channel.set(option.data.name, opt);
      }
      break;
    }
  }

  return options;
}

//MARK: Message
export async function detectMessageCommand(
  registry: Registry,
  data: Data,
  message: Message,
): Promise<void> {
  if (message.content.length === 0) return;
  if (!message.content.startsWith(data.prefix)) return;

  // Split arguments and extract command name.
  let args = message.content.split(/\s/).filter((str) => str.length !== 0);

  // Unify arguments delimited by quotation marks.
  let first: number, last: number;
  for (;;) {
    first = args.findIndex((str) => /^["“”]/.test(str));
    last = args.findIndex((str) => /["“”]$/.test(str));

    if (first === -1 || last === -1 || last <= first) break;

    const combined = args.slice(first, last + 1).join(" ");
    args.splice(first, last - first + 1, combined);
  }

  args = args.map((str) => str.replaceAll(/["“”]/g, ""));

  const commandName = args.shift()?.slice(data.prefix.length);
  if (commandName === undefined) return;
  // commandName: string

  // Determine if command exists in registry.
  const command = registry.commands.get(commandName);
  if (command === undefined)
    throw new Error(`Unknown or unregistered command \`/${commandName}\``);
  // command: Command

  // Handle commands accordingly.
  if (command.execute !== undefined) {
    let options = new Options();

    const context = new MessageContext(message, data);

    // Populate options if they exist.
    if (command.body !== undefined && isOptionArray(command.body)) {
      if (args.length > command.body.length) {
        throw new Error(
          `Too many arguments provided to command \`/${commandName}\`; ` +
          `expected at most ${String(command.body.length)}, ` +
          `found ${String(args.length)}.`
        );
      }

      while (args.length < command.body.length) {
        args.push("!");
      }
      options = populateMessageOptions(args, command.body, message);
    }

    // Attempt to execute command.
    await command.execute(context, options);
  } else if (command.body !== undefined && isSubcommandArray(command.body)) {
    const subcommandName = args.shift();
    if (subcommandName === undefined)
      throw new Error(`Subcommand missing in command \`/${commandName}\``);

    let options = new Options();

    const context = new MessageSubcommandContext(message, data, subcommandName, commandName);

    // Attempt to find and execute subcommand.
    const subcommand = command.body.find(
      (sub) => sub.data.name === subcommandName,
    );
    if (subcommand === undefined)
      throw new Error(`Unknown subcommand: \`/${commandName} ${subcommandName}\``);

    // Populate options if they exist.
    if (subcommand.body !== undefined && isOptionArray(subcommand.body)) {
      if (args.length > subcommand.body.length) {
        throw new Error(
          `Too many arguments provided to command: \`/${commandName} ${subcommandName}\`; ` +
          `expected at most ${String(subcommand.body.length)}, ` +
          `found ${String(args.length)}.`
        );
      }

      while (args.length !== command.body.length) {
        args.push("!");
      }
      options = populateMessageOptions(args, subcommand.body, message);
    }

    await subcommand.execute(context, options);
  } else {
    throw new Error(`Missing execute function in command \`${commandName}\``);
  }
}

//MARK: Message Options
function populateMessageOptions(
  sources: string[],
  targets: NonEmptyReadonlyArray<CommandOption>,
  message: Message,
): Options {
  const options = new Options();

  //the middle bit captures IDs, 
  //the outer is just how discord represents these things
  const USER_PING_REGEX = /<@(\d{18,19})>/;
  const ROLE_PING_REGEX = /<@&(\d{18,19})>/;
  const CHANNEL_LINK_REGEX = /<#(\d{18,19})>/;

  for (const [index, option] of targets.entries()) {
    let sourceType: "optional" | CommandOptionType;
    const targetType = option.type;

    const source = sources[index];

    const isUserPing = USER_PING_REGEX.test(source);
    const isRolePing = ROLE_PING_REGEX.test(source);

    if (source === "!") {
      sourceType = "optional";
    } else if (targetType === "string") {
      //anything can be a string if it needs to be
      sourceType = "string";
    } else if (!isNaN(Number(sources.at(index)))) {
      sourceType = "number";
    } else if (source === "true" || source === "false") {
      sourceType = "boolean";
    } else if ((isUserPing || isRolePing) && targetType === "mentionable") {
      sourceType = "mentionable";
    } else if (isUserPing) {
      sourceType = "user";
    } else if (isRolePing) {
      sourceType = "role";
    } else if (CHANNEL_LINK_REGEX.test(source)) {
      sourceType = "channel";
    } else {
      sourceType = "string";
    }

    if (sourceType !== targetType && sourceType !== "optional") {
      throw new Error(
        `Argument at position ${String(index + 1)} ` +
          `is of type \`${sourceType}\` ` +
          `when type \`${targetType}\` was expected.`,
      );
    }

    function getMentionableFromID(regex: RegExp, type: "user"): User;
    function getMentionableFromID(regex: RegExp, type: "role"): Role;
    function getMentionableFromID(regex: RegExp, type: "channel"): Channel;
    function getMentionableFromID(regex: RegExp, type: "user" | "role" | "channel"): User | Role | Channel {
      const pingedID = (regex.exec(source))?.at(1);
      if (pingedID === undefined)
        throw new Error(`Error parsing pinged ${type} for command option "${option.data.name}".`);

      const pingedThing = message.mentions[`${type}s`].get(pingedID);
      if (pingedThing === undefined)
        throw new Error(`Error locating pinged ${type} for command option "${option.data.name}".`);
      
      return pingedThing;
    }

    switch (sourceType) {
    case "number":
      options.number.set(option.data.name, Number(source));
      break;
    case "boolean":
      options.boolean.set(option.data.name, source === "true");
      break;
    case "string": {
      if (option.choices && !option.choices.map(e => e.toLowerCase()).includes(source.toLowerCase())) {
        const optionsFormatter = new Intl.ListFormat("en", {type: "disjunction"});
        const choicesList = optionsFormatter.format(option.choices.map(choice => `\`${choice}\``));
        throw new Error(`Provided "${source}" is invalid for option "${option.data.name}". Option must be one of ${choicesList}.`);
      }
      if (option.length && (
        source.length < option.length[0] ||
        source.length > option.length[1]
      )) {
        throw new Error(`Option ${option.data.name} must be between ${option.length[0].toString()} and ${option.length[1].toString()} characters (${source.length.toString()} characters provided).`);
      }

      options.string.set(option.data.name, source);
      break;
    }
    case "user": {
      const pingedUser = getMentionableFromID(USER_PING_REGEX, "user");
      options.user.set(option.data.name, pingedUser);
      break;
    } case "role": {
      const pingedRole = getMentionableFromID(ROLE_PING_REGEX, "role");
      options.role.set(option.data.name, pingedRole);
      break;
    } case "mentionable": {
      if (isUserPing) {
        const pingedUser = getMentionableFromID(USER_PING_REGEX, "user");
        options.mentionable.set(option.data.name, pingedUser);
        break;
      } else if (isRolePing) {
        const pingedRole = getMentionableFromID(ROLE_PING_REGEX, "role");
        options.mentionable.set(option.data.name, pingedRole);
        break;
      } else {
        //this should not happen.
        throw new Error("Unexpected issue occured parsing mentionable.");
      }
    } case "channel": {
      const linkedChannel = getMentionableFromID(CHANNEL_LINK_REGEX, "channel");
      options.channel.set(option.data.name, linkedChannel);
      break;
    }
    case "optional":
      if (option.data.required)
        throw new Error(`Argument "${option.data.name}" (position ${String(index + 1)}) is required.`);

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
      case "user":
        options.user.set(option.data.name, null);
        break;
      case "role":
        options.role.set(option.data.name, null);
        break;
      case "mentionable":
        options.mentionable.set(option.data.name, null);
        break;
      case "channel":
        options.channel.set(option.data.name, null);
        break;
      }
      break;
    }
  }

  return options;
}

//MARK: Autocomplete
export async function handleAutocomplete(
  data: Data,
  interaction: AutocompleteInteraction,
): Promise<void> {
  const commandName = interaction.commandName;
  const command = data.registry.commands.get(commandName);

  if (command === undefined)
    throw new Error(`Unknown or unregistered command \`/${commandName}\``);
  
  if (command.body === undefined) {
    throw new Error(`Autocomplete call on command \`/${commandName}\` without provided options.`);
  } else if (isOptionArray(command.body)) {
    if (command.autocomplete === undefined)
      throw new Error(`Missing autocomplete handler in command \`/${commandName}\``);

    const context = new AutocompleteContext(interaction, data);
    await command.autocomplete(context);

  } else if (isSubcommandArray(command.body)) {
    const subcommandName = interaction.options.getSubcommand();

    // Attempt to find subcommand.
    const subcommand = command.body.find(
      (sub) => sub.data.name === subcommandName,
    );

    if (subcommand === undefined) {
      throw new Error(
        `Unknown subcommand: \`/${commandName} ${subcommandName}\``,
      );
    }
  
    if (subcommand.autocomplete === undefined)
      throw new Error(`Missing autocomplete handler in command \`/${commandName} ${subcommandName}\``);

    const context = new AutocompleteContext(interaction, data);
    await subcommand.autocomplete(context);

  }
  
  await sleep(1);
}