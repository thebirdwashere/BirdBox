import {
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  TextBasedChannel,
  Guild,
  User,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { Data } from "./types.js";

export interface CommandContext {
  data: Data;
  channel: TextBasedChannel | null;
  lastReply: Message | null;
  guild: Guild | null;
  user: User;
  timestamp: number;

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

export class MessageContext implements CommandContext {
  message: Message;

  data: Data;
  channel: TextBasedChannel | null;
  lastReply: Message | null;
  guild: Guild | null;
  user: User;
  timestamp: number;

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
  }
}

export class ChatInputCommandInteractionContext implements CommandContext {
  interaction: ChatInputCommandInteraction;

  data: Data;
  channel: TextBasedChannel | null;
  lastReply: Message | null;
  guild: Guild | null;
  user: User;
  timestamp: number;

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
  }
}
