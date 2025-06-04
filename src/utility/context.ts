import {
  ChatInputCommandInteraction,
  Message,
  EmbedBuilder,
  TextBasedChannel,
} from "discord.js";
import { Data } from "./types.js";

export interface CommandContext {
  data: Data;
  channel: TextBasedChannel;
  lastReply: Message | null;

  /**
   * Attempts to respond to the command. Returns the message after completion.
   */
  reply: (
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
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
  channel: TextBasedChannel;
  lastReply: Message | null;

  async reply(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
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
    if (this.channel.isSendable()) {
      return await this.channel.send(content);
    } else throw new Error("Tried to send message in a unsendable channel.");
  }

  async sendTyping(): Promise<void> {
    if (this.channel.isSendable()) {
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
  }
}

export class ChatInputCommandInteractionContext implements CommandContext {
  interaction: ChatInputCommandInteraction;

  data: Data;
  channel: TextBasedChannel;
  lastReply: Message | null;

  async reply(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
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
    if (this.channel.isSendable()) {
      return await this.channel.send(content);
    } else throw new Error("Tried to send message in a unsendable channel.");
  }

  async sendTyping(): Promise<void> {
    if (this.channel.isSendable()) {
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

    if (interaction.channel === null)
      throw new Error("Commands must be triggered inside of a guild.");
    this.channel = interaction.channel;
  }
}
