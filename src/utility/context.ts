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
  prefix: string;

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

  /**
   * Attempts to reply with a button that opens the provided modal. 
   * Runs the provided callback function on modal submit.
   */
  replyModal: (
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ) => Promise<void>;
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
  
  constructor(message: Message, data: Data) {
    this.message = message;
    this.data = data;
    this.channel = message.channel;
    this.lastReply = null;
    this.guild = message.guild;
    this.user = message.author;
    this.timestamp = message.createdTimestamp;
    this.db = data.db;
    this.prefix = data.prefix;
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
    if (this.channel?.isSendable()) {
      await this.channel.sendTyping();
    } else
      throw new Error(
        "Tried to send typing indicator in a unsendable channel.",
      );
  }

  async replyModal(
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ): Promise<void> {
    if (!this.channel?.isSendable())
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

    const response = await this.reply({ components: [buttonRow]});

    const thisUserID = this.user.id;

    const buttonFilter = (i: ButtonInteraction): boolean => i.user.id === thisUserID;

    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000,
      filter: buttonFilter,
    });

    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      await i.showModal(modal);

      buttonRow.components[0].setDisabled(true);
      await response.edit({ components: [buttonRow]});
      
      const modalFilter = (i: ModalSubmitInteraction): boolean => (
        i.user.id === thisUserID
        && i.customId === modalId
      );

      await i.awaitModalSubmit({ filter: modalFilter, time: 300_000 })
        .then(async i => { await callback(i, response); })
        .catch(async () => { await response.edit("Modal interaction has timed out."); });
    }
    
     
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i) => {await handleButtonInteraction(i);});

    async function handleButtonTimeout(): Promise<void> {
      //disable the buttons
      buttonRow.components[0].setDisabled(true);
      await response.edit({ components: [buttonRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async () => {await handleButtonTimeout();});
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
  prefix: string;

  constructor(interaction: ChatInputCommandInteraction, data: Data) {
    this.interaction = interaction;
    this.data = data;
    this.lastReply = null;
    this.user = interaction.user;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.timestamp = interaction.createdTimestamp;
    this.db = data.db;
    this.prefix = "/";
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

  async replyModal(
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ): Promise<void> {
    if (!this.channel?.isSendable())
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

    const response = await this.reply({ components: [buttonRow]});

    const thisUserID = this.user.id;

    const buttonFilter = (i: ButtonInteraction): boolean => i.user.id === thisUserID;

    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000,
      filter: buttonFilter,
    });

    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      await i.showModal(modal);

      buttonRow.components[0].setDisabled(true);
      await response.edit({ components: [buttonRow]});
      
      const modalFilter = (i: ModalSubmitInteraction): boolean => (
        i.user.id === thisUserID
        && i.customId === modalId
      );

      await i.awaitModalSubmit({ filter: modalFilter, time: 300_000 })
        .then(async i => { await callback(i, response); })
        .catch(async () => { await response.edit("Modal interaction has timed out."); });
    }
    
     
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i) => {await handleButtonInteraction(i);});

    async function handleButtonTimeout(): Promise<void> {
      //disable the buttons
      buttonRow.components[0].setDisabled(true);
      await response.edit({ components: [buttonRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async () => {await handleButtonTimeout();});
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
    choices: ApplicationCommandOptionChoiceData[],
    blank?: string,
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

    if (convertedContent.length > 0) {
      await this.interaction.respond(convertedContent.slice(0, 25));
    } else if (blank) {
      await this.interaction.respond([{ name: blank, value: blank }]);
    } else {
      await this.interaction.respond([]);
    }
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

  constructor(interaction: ContextMenuCommandInteraction, data: Data) {
    this.interaction = interaction;
    this.data = data;
    this.lastReply = null;
    this.user = interaction.user;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.timestamp = interaction.createdTimestamp;
    this.db = data.db;
    this.prefix = "/";
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

  async replyModal(
    modal: ModalBuilder, 
    callback: ((i: ModalSubmitInteraction) => Promise<void>)
    | ((i: ModalSubmitInteraction, msg: Message) => Promise<void>)
  ): Promise<void> {
    if (!this.channel?.isSendable())
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

    const response = await this.reply({ components: [buttonRow]});

    const thisUserID = this.user.id;

    const buttonFilter = (i: ButtonInteraction): boolean => i.user.id === thisUserID;

    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300_000,
      filter: buttonFilter,
    });

    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      await i.showModal(modal);

      buttonRow.components[0].setDisabled(true);
      await response.edit({ components: [buttonRow]});
      
      const modalFilter = (i: ModalSubmitInteraction): boolean => (
        i.user.id === thisUserID
        && i.customId === modalId
      );

      await i.awaitModalSubmit({ filter: modalFilter, time: 300_000 })
        .then(async i => { await callback(i, response); })
        .catch(async () => { await response.edit("Modal interaction has timed out."); });
    }
    
     
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i) => {await handleButtonInteraction(i);});

    async function handleButtonTimeout(): Promise<void> {
      //disable the buttons
      buttonRow.components[0].setDisabled(true);
      await response.edit({ components: [buttonRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async () => {await handleButtonTimeout();});
  }
}