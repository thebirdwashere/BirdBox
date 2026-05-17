import { AutocompleteInteraction, Channel, ChatInputCommandInteraction, ContextMenuCommandInteraction, Message, Role, User } from "discord.js";
import {
  CommandOption,
  isOptionArray,
  isSubcommandArray,
  Command,
  Subcommand,
  CommandOptionType,
  Options,
  testUserPermissions,
} from "./command.js";
import {
  ChatInputCommandInteractionContext,
  ChatInputCommandInteractionSubcommandContext,
  MessageContext,
  MessageSubcommandContext,
  AutocompleteContext,
  ContextMenuCommandContext
} from "./context.js";
import { Registry } from "./registry.js";
import { Data, NonEmptyArray } from "./types.js";
import { sleep } from "./utility.js";
import perms from "../data/perms.json" with { type: "json" };
import { Perms } from "./types.js";

const PERMS = perms as Perms;

//MARK: ChatInput
export async function detectChatInputInteractionCommand(
  data: Data,
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const commandName = interaction.commandName;

  // Determine if command exists in registry.
  const command = data.registry.commands.get(commandName);
  if (command === undefined)
    throw new Error(`Command \`/${commandName}\` does not exist.`);

  if (command.permissions) 
    testUserPermissions(command.permissions, PERMS, interaction.user.id);

  if (command.cooldown) {
    const lastUsed = command.cooldown.data.get(interaction.user.id);
    const currentTime = interaction.createdTimestamp;

    if (lastUsed && currentTime - lastUsed < command.cooldown.time) {
      const waitTime = Math.floor((command.cooldown.time - (currentTime - lastUsed)) / 1000);
      throw new Error(`Sorry, this command is on cooldown. Please wait ${String(waitTime)} more seconds before using \`/${command.data.name}\`.`);
    } else {
      command.cooldown.data.set(interaction.user.id, currentTime);
    }
  }

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
    if (subcommand === undefined)
      throw new Error(`Subcommand \`/${commandName} ${subcommandName}\` does not exist.`);

    if (subcommand.permissions)
      testUserPermissions(subcommand.permissions, PERMS, interaction.user.id);

    if (subcommand.cooldown) {
      const lastUsed = subcommand.cooldown.data.get(interaction.user.id);
      const currentTime = interaction.createdTimestamp;

      if (lastUsed && currentTime - lastUsed < subcommand.cooldown.time) {
        const waitTime = Math.floor((subcommand.cooldown.time - (currentTime - lastUsed)) / 1000);
        throw new Error(`Sorry, this subcommand is on cooldown. Please wait ${String(waitTime)} more seconds before using \`/${command.data.name} ${subcommand.data.name}\`.`);
      } else {
        subcommand.cooldown.data.set(interaction.user.id, currentTime);
      }
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
    throw new Error(`Command \`${data.prefix}${commandName}\` does not exist.`);
  // command: Command

  if (command.permissions) 
    testUserPermissions(command.permissions, PERMS, message.author.id);

  if (command.cooldown) {
    const lastUsed = command.cooldown.data.get(message.author.id);
    const currentTime = message.createdTimestamp;

    if (lastUsed && currentTime - lastUsed < command.cooldown.time) {
      const waitTime = Math.floor((command.cooldown.time - (currentTime - lastUsed)) / 1000);
      throw new Error(`Sorry, this command is on cooldown. Please wait ${String(waitTime)} more seconds before using \`/${command.data.name}\`.`);
    } else {
      command.cooldown.data.set(message.author.id, currentTime);
    }
  }

  // Handle commands accordingly.
  if (command.execute !== undefined) {
    let options = new Options();

    const context = new MessageContext(message, data);

    // Populate options if they exist.
    if (command.body !== undefined && isOptionArray(command.body)) {
      if (args.length > command.body.length) {
        throw new Error(
          `Too many arguments provided to command \`${data.prefix}${commandName}\`; ` +
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
    if (subcommandName === undefined) {
      const subcommandsFormatter = new Intl.ListFormat("en", {type: "conjunction",});
      const subcommandsList = subcommandsFormatter.format(command.body.map(sub => `\`${sub.data.name}\``));
      throw new Error(`Subcommand missing in command \`${data.prefix}${commandName}\`. Available subcommands are ${subcommandsList}.`);
    }


    let options = new Options();

    const context = new MessageSubcommandContext(message, data, subcommandName, commandName);

    // Attempt to find and execute subcommand.
    const subcommand = command.body.find(
      (sub) => sub.data.name === subcommandName,
    );
    if (subcommand === undefined)
      throw new Error(`Subcommand \`${data.prefix}${commandName} ${subcommandName}\` does not exist.`);

    if (subcommand.permissions) {
      testUserPermissions(subcommand.permissions, PERMS, message.author.id);
    }

    if (subcommand.cooldown) {
      const lastUsed = subcommand.cooldown.data.get(message.author.id);
      const currentTime = message.createdTimestamp;

      if (lastUsed && currentTime - lastUsed < subcommand.cooldown.time) {
        const waitTime = Math.floor((subcommand.cooldown.time - (currentTime - lastUsed)) / 1000);
        throw new Error(`Sorry, this subcommand is on cooldown. Please wait ${String(waitTime)} more seconds before using \`/${command.data.name} ${subcommand.data.name}\`.`);
      } else {
        subcommand.cooldown.data.set(message.author.id, currentTime);
      }
    }

    // Populate options if they exist.
    if (subcommand.body !== undefined && isOptionArray(subcommand.body)) {
      if (args.length > subcommand.body.length) {
        throw new Error(
          `Too many arguments provided to command \`${data.prefix}${commandName} ${subcommandName}\`; ` +
          `expected at most ${String(subcommand.body.length)}, ` +
          `found ${String(args.length)}.`
        );
      }

      while (args.length < subcommand.body.length) {
        args.push("!");
      }
      options = populateMessageOptions(args, subcommand.body, message);
    }

    await subcommand.execute(context, options);
  } else {
    throw new Error(`Missing execute function in command \`${commandName}\`.`);
  }
}

//MARK: Message Options
function populateMessageOptions(
  sources: string[],
  targets: Readonly<NonEmptyArray<CommandOption>>,
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
    } else if (!isNaN(Number(source))) {
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
    throw new Error(`Command \`/${commandName}\` does not exist.`);
  
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
        `Subcommand \`/${commandName} ${subcommandName}\` does not exist.`,
      );
    }
  
    if (subcommand.autocomplete === undefined)
      throw new Error(`Missing autocomplete handler in command \`/${commandName} ${subcommandName}\``);

    const context = new AutocompleteContext(interaction, data);
    await subcommand.autocomplete(context);

  }
  
  await sleep(1);
}

//MARK: Context Menu
export async function detectContextMenuCommand(
  data: Data,
  interaction: ContextMenuCommandInteraction,
): Promise<void> {
  const commandName = interaction.commandName;
  //go through regular commands
  let command = data.registry.commands
    .find(cmd => cmd.contextmenu?.label === interaction.commandName);

  if (command !== undefined) {
    const contextMenuData = command.contextmenu;
  
    if (contextMenuData === undefined)
      throw new Error(`Could not locate context menu command with name: ${commandName}`);

    if (command.execute === undefined) 
      throw new Error("Malformed context menu command is missing an execute function.");

    const context = new ContextMenuCommandContext(interaction, data);

    const options = new Options();
    if (contextMenuData.contextOption) {
      switch (contextMenuData.type) {
      case "message": {
        if (!interaction.isMessageContextMenuCommand())
          throw new Error("Invalid data for user-type context menu option.");

        options.string.set(contextMenuData.contextOption, interaction.targetMessage.content);

        break;
      } case "user": {
        if (!interaction.isUserContextMenuCommand())
          throw new Error("Invalid data for message-type context menu option.");
      
        options.user.set(contextMenuData.contextOption, interaction.targetUser);
        break;
      }
      }
    }

    if (contextMenuData.userContextOption) {
      if (!interaction.isMessageContextMenuCommand())
        throw new Error("Invalid data for user-type context menu option.");

      options.user.set(contextMenuData.userContextOption, interaction.targetMessage.author);
    }

    await command.execute(context, options);
  } else {
    //try looking for a subcommand
    let subcommand: Subcommand | undefined = undefined;
    for (const cmd of data.registry.commands.values()) {
      if (!cmd.body || !isSubcommandArray(cmd.body)) continue;
      const foundSubcommand = cmd.body
        .find(subcmd => subcmd.contextmenu?.label === interaction.commandName);

      if (foundSubcommand) {
        command = cmd;
        subcommand = foundSubcommand;
        break;
      }
    }
    
    if (command === undefined || subcommand === undefined)
      throw new Error("Could not locate context menu command.");
    
    const contextMenuData = subcommand.contextmenu;
  
    if (contextMenuData === undefined)
      throw new Error(`Could not locate context menu command with name: ${commandName}`);
    
    const context = new ContextMenuCommandContext(interaction, data);

    const options = new Options();
    if (contextMenuData.contextOption) {
      switch (contextMenuData.type) {
      case "message": {
        if (!interaction.isMessageContextMenuCommand())
          throw new Error("Invalid data for user-type context menu option.");

        options.string.set(contextMenuData.contextOption, interaction.targetMessage.content);
        break;
      } case "user": {
        if (!interaction.isUserContextMenuCommand())
          throw new Error("Invalid data for message-type context menu option.");
      
        options.user.set(contextMenuData.contextOption, interaction.targetUser);
        break;
      }
      }
    }

    if (contextMenuData.userContextOption) {
      if (!interaction.isMessageContextMenuCommand())
        throw new Error("Invalid data for user-type context menu option.");

      options.user.set(contextMenuData.userContextOption, interaction.targetMessage.author);
    }

    await subcommand.execute(context, options);
  }
}