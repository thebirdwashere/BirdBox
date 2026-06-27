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
  ContextMenuCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
  CollectorFilter,
  MessageComponentType,
  Interaction,
} from "discord.js";
import { Data } from "./types.js";
import { Database } from "./database.js";
import { handleCommandError } from "./error.js";

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
  prefix: string;
  command: string;

  /**
   * Attempts to respond to the command.
   * 
   * @param content The content of your response. Either a simple string, 
   * or an object containing your message's content, embeds, and/or components.
   * @returns The Message object of the bot's response.
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
   * Attempts to send a message in the same channel as the command.
   * 
   * @param content The content of your response. Either a simple string, 
   * or an object containing your message's content, embeds, and/or components.
   * @returns The Message object of the bot's response.
   */
  send: (
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
          components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        },
  ) => Promise<Message>;

  /**
   * Attempts to send a typing indicator in the same channel as the command.
   */
  sendTyping: () => Promise<void>;

  /**
   * Attempts to capture ActionRow data from the context's most recent reply.
   * Responds based on the provided callback functions.
   * 
   * @param params An object containing a minimum the type of interaction you 
   * expect, and a callback function to be executed when the user interacts.
   * Maximums, time limits, and an interaction filter can also be optionally provided.
   */
  collectInteractions: (
    params: {
      type: MessageComponentType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter?: CollectorFilter<[any]>,
      maxInteractions?: number,
      maxComponents?: number,
      maxUsers?: number,
      timeLimit?: number,
      idleTimeLimit?: number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onInteraction: (msg: Message, i: any) => Promise<void>,
      onTimeout?: (msg: Message) => Promise<void>,
    }
  ) => void;

  /**
   * Attempts to reply with a button that opens the provided modal. 
   * Runs the provided callback function on modal submit.
   * 
   * @param modal The modal you want to show the user.
   * @param callback The callback function to be executed when the user submits the modal.
   */
  replyModal: (
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ) => Promise<void>;
}

export interface SubcommandContext {
  subcommand: string;
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
  prefix: string;
  command: string;
  
  constructor(message: Message, data: Data, command: string) {
    this.message = message;
    this.data = data;
    this.channel = message.channel;
    this.lastReply = null;
    this.guild = message.guild;
    this.user = message.author;
    this.timestamp = message.createdTimestamp;
    this.db = data.db;
    this.prefix = data.prefix;
    this.command = command;
  }
  
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
    await baseSendTyping(this);
  }

  collectInteractions(
    params: {
      type: MessageComponentType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter?: CollectorFilter<[any]>,
      maxInteractions?: number,
      maxComponents?: number,
      maxUsers?: number,
      timeLimit?: number,
      idleTimeLimit?: number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onInteraction: (msg: Message, i: any) => Promise<void>,
      onTimeout?: (msg: Message) => Promise<void>,
    }
  ): void {
    baseCollectInteractions(this, params);
  };

  async replyModal(
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ): Promise<void> {
    await baseReplyModal(this, modal, callback);
  }
}

export class MessageSubcommandContext extends MessageContext implements SubcommandContext {
  subcommand: string;

  constructor(message: Message, data: Data, command: string, subcommand: string) {
    super(message, data, command);
    this.subcommand = subcommand;
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
  prefix: string;
  command: string;

  constructor(interaction: ChatInputCommandInteraction, data: Data, command: string) {
    this.interaction = interaction;
    this.data = data;
    this.lastReply = null;
    this.user = interaction.user;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.timestamp = interaction.createdTimestamp;
    this.db = data.db;
    this.prefix = "/";
    this.command = command;
  }

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
          components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        },
  ): Promise<Message> {
    if (this.channel?.isSendable()) {
      return await this.channel.send(content);
    } else throw new Error("Tried to send message in a unsendable channel.");
  }

  async sendTyping(): Promise<void> {
    await baseSendTyping(this);
  }

  collectInteractions(
    params: {
      type: MessageComponentType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter?: CollectorFilter<[any]>,
      maxInteractions?: number,
      maxComponents?: number,
      maxUsers?: number,
      timeLimit?: number,
      idleTimeLimit?: number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onInteraction: (msg: Message, i: any) => Promise<void>,
      onTimeout?: (msg: Message) => Promise<void>,
    }
  ): void {
    baseCollectInteractions(this, params);
  };

  async replyModal(
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ): Promise<void> {
    await baseReplyModal(this, modal, callback);
  }
}

export class ChatInputCommandInteractionSubcommandContext extends ChatInputCommandInteractionContext implements SubcommandContext {
  subcommand: string;

  constructor(interaction: ChatInputCommandInteraction, data: Data, commmand: string, subcommand: string) {
    super(interaction, data, commmand);
    this.subcommand = subcommand;
  }
}

//MARK: ContextMenuCommandContext
export class ContextMenuCommandContext implements CommandContext {
  interaction: ContextMenuCommandInteraction;

  data: Data;
  channel: TextBasedChannel | null;
  lastReply: Message | null;
  guild: Guild | null;
  user: User;
  timestamp: number;
  db: Database;
  prefix: string;
  command: string;

  constructor(interaction: ContextMenuCommandInteraction, data: Data, command: string) {
    this.interaction = interaction;
    this.data = data;
    this.lastReply = null;
    this.user = interaction.user;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.timestamp = interaction.createdTimestamp;
    this.db = data.db;
    this.prefix = "/";
    this.command = command;
  }

  async reply(
    content:
    | string
    | {
      content?: string;
      embeds?: EmbedBuilder[];
      components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        },
  ): Promise<Message> {
    let callbackResponse;

    if (typeof content === "object") {
      callbackResponse = await this.interaction.reply({ 
        content: content.content, 
        embeds: content.embeds,
        components: content.components,
        withResponse: true 
      });
      this.lastReply = callbackResponse.resource?.message ?? null;
    } else {
      callbackResponse = await this.interaction.reply({ content, withResponse: true });
      this.lastReply = callbackResponse.resource?.message ?? null;
    }
    if (this.lastReply === null)
      throw new Error(`Interaction reply failed to create message in command ${this.interaction.commandName}.`);

    return this.lastReply;
  }

  async send(
    content:
      | string
      | {
          content?: string;
          embeds?: EmbedBuilder[];
          components?: ActionRowBuilder<MessageActionRowComponentBuilder>[];
        },
  ): Promise<Message> {
    if (this.channel?.isSendable()) {
      return await this.channel.send(content);
    } else throw new Error("Tried to send message in a unsendable channel.");
  }

  collectInteractions(
    params: {
      type: MessageComponentType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter?: CollectorFilter<[any]>,
      maxInteractions?: number,
      maxComponents?: number,
      maxUsers?: number,
      timeLimit?: number,
      idleTimeLimit?: number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onInteraction: (msg: Message, i: any) => Promise<void>,
      onTimeout?: (msg: Message) => Promise<void>,
    }
  ): void {
    baseCollectInteractions(this, params);
  };

  async sendTyping(): Promise<void> {
    await baseSendTyping(this);
  }

  async replyModal(
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ): Promise<void> {
    await baseReplyModal(this, modal, callback);
  }
}

//MARK: Base Functions
async function baseSendTyping(ctx: CommandContext): Promise<void> {
  if (ctx.channel?.isSendable()) {
    await ctx.channel.sendTyping();
  } else {
    throw new Error("Tried to send typing indicator in a unsendable channel.");
  }
}

function baseCollectInteractions(
  ctx: CommandContext,
  params: {
    type: MessageComponentType,
    filter?: CollectorFilter<[Interaction]>,
    maxInteractions?: number,
    maxComponents?: number,
    maxUsers?: number,
    timeLimit?: number,
    idleTimeLimit?: number,
    //a shame I have to use any in this signature, but
    //typescript doesn't narrow function parameters
    //even when they conform just fine to the desired type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onInteraction: (msg: Message, i: any) => Promise<void>,
    onTimeout?: (msg: Message) => Promise<void>,
  }
): void {
  const response = ctx.lastReply;
  if (response === null)
    throw new Error("Tried to collect responses with no recent reply.");
  
  const buttonCollector = response.createMessageComponentCollector({ 
    componentType: params.type, 
    filter: params.filter,
    max: params.maxInteractions,
    maxComponents: params.maxComponents,
    maxUsers: params.maxUsers,
    time: "timeLimit" in params ? params.timeLimit : undefined,
    idle: "idleTimeLimit" in params ? params.idleTimeLimit : undefined,
  });
  
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  buttonCollector.on("collect", async i => {
    try {
      await params.onInteraction(response, i);
    } catch (e: unknown) {
      await handleCommandError(ctx, e);
    }
  });

  if ("onTimeout" in params && params.onTimeout !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async _ => {
      try {
        await params.onTimeout?.(response);
      } catch (e: unknown) {
        await handleCommandError(ctx, e);
      }
    });
  }
}

const DEFAULT_MODAL_TIME_LIMIT = 600_000;

async function baseReplyModal(
  ctx: CommandContext,
  modal: ModalBuilder, 
  callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
): Promise<void> {
  if (!ctx.channel?.isSendable())
    throw new Error("Tried to send a modal in a unsendable channel.");

  const modalId = modal.data.custom_id;
  const modalTitle = modal.data.title;
  if (modalId == null || modalTitle == null)
    throw new Error("Custom ID and title are required to display modal.");

  const modalButton = new ButtonBuilder()
    .setCustomId(`${modalId}-modal-button`)
    .setLabel(modalTitle)
    .setStyle(ButtonStyle.Success);
  const buttonRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(modalButton);

  await ctx.reply({ components: [buttonRow]});

  const thisUserID = ctx.user.id;

  async function onInteraction(msg: Message, i: ButtonInteraction): Promise<void> {
    await i.showModal(modal);

    buttonRow.components[0].setDisabled(true);
    await msg.edit({ components: [buttonRow]});
      
    const modalFilter = (i: ModalSubmitInteraction): boolean => (
      i.user.id === thisUserID
        && i.customId === modalId
    );

    await i.awaitModalSubmit({ filter: modalFilter, time: 300_000 })
      .then(async i => { await callback(i, msg); })
      .catch(async (e: unknown) => { console.error(e); await msg.edit("Modal interaction has timed out."); });
  }

  async function onTimeout(msg: Message): Promise<void> {
    buttonRow.components[0].setDisabled(true);
    await msg.edit({ components: [buttonRow] });
  }

  baseCollectInteractions(ctx, {
    type: ComponentType.Button,
    filter: (i: Interaction): boolean => i.user.id === thisUserID,
    timeLimit: DEFAULT_MODAL_TIME_LIMIT,
    onInteraction,
    onTimeout
  });
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
    choices: ApplicationCommandOptionChoiceData[],
    blank?: string,
  ): Promise<void> {
    const current = this.option.value.toLowerCase();

    console.log(current);

    let responseElements = choices;
    if (current !== "") {
      const choicesStartsWith = choices.filter(choice => choice.name.toLowerCase().startsWith(current));
      const choicesContains = choices.filter(choice => {
        const name = choice.name.toLowerCase();
        return name.includes(current) && !name.startsWith(current);
      });

      responseElements = choicesStartsWith.concat(choicesContains);
    };

    if (responseElements.length !== 0) {
      await this.interaction.respond(responseElements.slice(0, 25));
    } else if (blank) {
      await this.interaction.respond([{ name: blank, value: blank }]);
    } else {
      await this.interaction.respond([]);
    }
  }

  /**
   * Attempts to respond to the autocomplete with an array of strings, 
   * formatted into choice data. 
   * Automatically filters responses based on the user's current input.
   */
  async respondStrings(
    choices: string[],
    blank?: string,
  ): Promise<void> {
    const convertedContent = choices.map((choice) => ({ name: choice, value: choice }));
    await this.respond(convertedContent, blank);
  }

  /**
   * Attempts to respond to the autocomplete with a single string.
   */
  async respondMessage(
    message: string,
  ): Promise<void> {
    await this.interaction.respond([{ name: message, value: message }]);
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