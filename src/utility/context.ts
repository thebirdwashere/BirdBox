import { ChatInputCommandInteraction, Message, EmbedBuilder } from "discord.js";
import { panic } from "./utility.js";

export interface CommandContext {
  data: object;
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
  data: object;
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

  constructor(message: Message, data: object) {
    this.message = message;
    this.options = [];
    this.data = data;
  }
}

export class ChatInputCommandInteractionContext implements CommandContext {
  data: object;
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

  constructor(interaction: ChatInputCommandInteraction, data: object) {
    this.interaction = interaction;
    this.options = [];
    this.data = data;
  }
}
