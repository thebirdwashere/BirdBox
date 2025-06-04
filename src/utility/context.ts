import { ChatInputCommandInteraction, Message, EmbedBuilder } from "discord.js";
import { panic } from "./utility.js";
import { Data } from "./types.js";

export interface CommandContext {
  data: Data;
  options: string[];

  reply: (
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
        },
  ) => Promise<Message>;
}

export class MessageContext implements CommandContext {
  data: Data;
  message: Message;
  options: string[];

  async reply(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
        },
  ): Promise<Message> {
    return await this.message.reply(content);
  }

  constructor(message: Message, data: Data) {
    this.message = message;
    this.options = [];
    this.data = data;
  }
}

export class ChatInputCommandInteractionContext implements CommandContext {
  data: Data;
  interaction: ChatInputCommandInteraction;
  options: string[];

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
    return message.resource?.message ?? panic("Could not find message.");
  }

  constructor(interaction: ChatInputCommandInteraction, data: Data) {
    this.interaction = interaction;
    this.options = [];
    this.data = data;
  }
}
