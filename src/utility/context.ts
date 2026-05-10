import {
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  TextBasedChannel,
  Guild,
  User,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  AutocompleteInteraction,
  ApplicationCommandOptionChoiceData,
  AutocompleteFocusedOption,
} from "discord.js";
import { Data } from "./types.js";
import { Database } from "./database.js";

export interface BaseContext {
  data: Data;
  channel: TextBasedChannel | null;
  guild: Guild | null;
  user: User;
  timestamp: number;
  db: Database;
}

//MARK: CommandContext
export interface CommandContext extends BaseContext {
  data: Data;
  channel: TextBasedChannel | null;
  lastReply: Message | null;
  guild: Guild | null;
  user: User;
  timestamp: number;
  db: Database;

  /**
   * Attempts to respond to the command. Returns the message after completion.
   */
  reply: (
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
          components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        },
  ) => Promise<Message>;

  /**
   * Attempts to send a message in the same channel as the command. Returns the
   * message after completion.
   */
  send: (
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
        },
  ) => Promise<Message>;

  /**
   * Attempts to send a typing indicator in the same channel as the command.
   */
  sendTyping: () => Promise<void>;
}

//MARK: MessageContext
export class MessageContext implements CommandContext {
  message: Message;

  data: Data;
  channel: TextBasedChannel | null;
  lastReply: Message | null;
  guild: Guild | null;
  user: User;
  timestamp: number;
  db: Database;

  async reply(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
          components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        },
  ): Promise<Message> {
    this.lastReply = await this.message.reply(content);
    return this.lastReply;
  }

  async send(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
        },
  ): Promise<Message> {
    if (this.channel?.isSendable()) {
      return await this.channel.send(content);
    } else throw new Error("Tried to send message in a unsendable channel.");
  }

  async sendTyping(): Promise<void> {
    if (this.channel?.isSendable()) {
      await this.channel.sendTyping();
    } else
      throw new Error(
        "Tried to send typing indicator in a unsendable channel.",
      );
  }

  constructor(message: Message, data: Data) {
    this.message = message;
    this.data = data;
    this.channel = message.channel;
    this.lastReply = null;
    this.guild = message.guild;
    this.user = message.author;
    this.timestamp = message.createdTimestamp;
    this.db = data.db;
  }
}


export interface SubcommandContext {
  currentSubcommand: string;
  parentCommand: string;
}

export class MessageSubcommandContext extends MessageContext implements SubcommandContext {
  currentSubcommand: string;
  parentCommand: string;

  constructor(message: Message, data: Data, subcommand: string, parent: string) {
    super(message, data);
    this.currentSubcommand = subcommand;
    this.parentCommand = parent;
  }
}

//MARK: ChatInputCommandInteractionContext
export class ChatInputCommandInteractionContext implements CommandContext {
  interaction: ChatInputCommandInteraction;

  data: Data;
  channel: TextBasedChannel | null;
  lastReply: Message | null;
  guild: Guild | null;
  user: User;
  timestamp: number;
  db: Database;

  async reply(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
          components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        },
  ): Promise<Message> {
    const message =
      typeof content === "string"
        ? await this.interaction.reply({ content: content, withResponse: true })
        : await this.interaction.reply({ ...content, withResponse: true });
    if (!message.resource?.message)
      throw new Error("Failed to fetch message from interaction reply.");
    this.lastReply = message.resource.message;
    return this.lastReply;
  }

  async send(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
        },
  ): Promise<Message> {
    if (this.channel?.isSendable()) {
      return await this.channel.send(content);
    } else throw new Error("Tried to send message in a unsendable channel.");
  }

  async sendTyping(): Promise<void> {
    if (this.channel?.isSendable()) {
      await this.channel.sendTyping();
    } else
      throw new Error(
        "Tried to send typing indicator in a unsendable channel.",
      );
  }

  constructor(interaction: ChatInputCommandInteraction, data: Data) {
    this.interaction = interaction;
    this.data = data;
    this.lastReply = null;
    this.user = interaction.user;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.timestamp = interaction.createdTimestamp;
    this.db = data.db;
  }
}

export class ChatInputCommandInteractionSubcommandContext extends ChatInputCommandInteractionContext implements SubcommandContext {
  currentSubcommand: string;
  parentCommand: string;

  constructor(interaction: ChatInputCommandInteraction, data: Data, subcommand: string, parent: string) {
    super(interaction, data);
    this.currentSubcommand = subcommand;
    this.parentCommand = parent;
  }
}

//MARK: AutocompleteContext
export class AutocompleteContext implements BaseContext {
  interaction: AutocompleteInteraction;
  option:  AutocompleteFocusedOption;

  data: Data;
  channel: TextBasedChannel | null;
  guild: Guild | null;
  user: User;
  timestamp: number;
  db: Database;

  constructor(interaction: AutocompleteInteraction, data: Data) {
    this.interaction = interaction;
    this.option = interaction.options.getFocused(true);
    this.data = data;
    this.user = interaction.user;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.timestamp = interaction.createdTimestamp;
    this.db = data.db;
  }

  /**
   * Attempts to respond to the autocomplete with a list of choices.
   * Automatically filters responses based on the user's current input.
   */
  async respond(
    choices: ApplicationCommandOptionChoiceData[]
  ): Promise<void> {
    const current = this.option.value.toLowerCase();

    let responseElements = choices;
    if (current !== "") {
      const choicesStartsWith = choices.filter(choice => choice.name.toLowerCase().startsWith(current));
      const choicesContains = choices.filter(choice => {
        const name = choice.name.toLowerCase();
        return name.includes(current) && !name.startsWith(current);
      });

      responseElements = choicesStartsWith.concat(choicesContains);
    };

    await this.interaction.respond(responseElements.slice(0, 25));
  }

  /**
   * Attempts to respond to the autocomplete with an array of strings, 
   * formatted into choice data. 
   * Automatically filters responses based on the user's current input.
   */
  async respondStrings(
    choices: string[],
  ): Promise<void> {
    const convertedContent = choices.map((choice) => ({ name: choice, value: choice }));
    await this.respond(convertedContent);
  }

  /**
   * Attempts to respond to the autocomplete with a list of choices, with no automatic filtering.
   * Does not cap the length at 25, so this function can error!
   */
  async respondRaw(
    choices: ApplicationCommandOptionChoiceData[]
  ): Promise<void> {
    await this.interaction.respond(choices);
  }
}

