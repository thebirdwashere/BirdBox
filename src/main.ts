import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";

import "dotenv/config";

import perms from "./data/perms.json" with { type: "json" };

import { fetchConfigOption, panic } from "./utility/utility.js";
import { handleAutocompleteError, handleCommandError } from "./utility/error.js";
import { Registry } from "./utility/registry.js";
import {
  AutocompleteContext,
  ChatInputCommandInteractionContext,
  ContextMenuCommandContext,
  MessageContext,
} from "./utility/context.js";
import {
  detectChatInputInteractionCommand,
  detectContextMenuCommand,
  detectMessageCommand,
  handleAutocomplete,
} from "./utility/process.js";
import { Data, Perms, SnipedMessage } from "./utility/types.js";

import { Database } from "./utility/database.js";

const COMMAND_LINE_ARGUMENTS = process.argv.slice(2);
const DEVMODE = COMMAND_LINE_ARGUMENTS[0] === "--DEV-MODE";
if (DEVMODE) console.log("--- Developer Mode Enabled ---");

//MARK: Data & Registry
const BOT_TOKEN =
  process.env.BOT_TOKEN ?? panic("Failed to find BOT_TOKEN in environment.");
const BOT_ID =
  process.env.BOT_ID ?? panic("Failed to find BOT_ID in environment.");
const BOT_PREFIX =
  process.env.BOT_PREFIX ?? panic("Failed to find BOT_PREFIX in environment.");
const PERMS = perms as Perms;
const DB = new Database("src/database.sqlite");
const CLIENT = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
});
const REGISTRY = new Registry();
const DATA: Data = {
  prefix: BOT_PREFIX,
  id: BOT_ID,
  perms: PERMS,
  registry: REGISTRY,
  client: CLIENT,
  db: DB,
  devMode: DEVMODE,
};

if (DEVMODE) console.log("Beginning to detect commands.");
await REGISTRY.detectCommands(path.join(import.meta.dirname, "commands"), DEVMODE);

if (DEVMODE) console.log("\nBeginning to detect interjections.");
await REGISTRY.detectInterjections(path.join(import.meta.dirname, "interjections"), DEVMODE);

if (DEVMODE) console.log("\nDetection complete. Logging in...\n");

CLIENT.on(Events.ClientReady, (_event) => {
  console.log("Birdbox Rewrite is now online.");
  console.log(`Logged in as ${CLIENT.user?.tag ?? "(undefined)"}.`);
  console.log("Logs will be shown in this terminal.\n");

  if (DEVMODE) console.log("Command registry is being skipped due to dev mode. \nIf you have made changes to commands, use `npm run start` to update them.");
  else REGISTRY.registerCommands(BOT_TOKEN, BOT_ID).catch(console.error);
});

//MARK: Interaction
CLIENT.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (DEVMODE) console.log(`Interaction originates from chat input command: "${interaction.commandName}"`);

    detectChatInputInteractionCommand(DATA, interaction).catch(
      async (error: unknown) => {
        const context = new ChatInputCommandInteractionContext(
          interaction,
          DATA,
        );
        await handleCommandError(context, interaction.commandName, error);
      },
    );
  } else if (interaction.isAutocomplete()) {
    if (DEVMODE) console.log(`Interaction originates from chat input command: "${interaction.commandName}"`);

    handleAutocomplete(DATA, interaction).catch(
      (error: unknown) => {
        const context = new AutocompleteContext(
          interaction,
          DATA,
        );
        handleAutocompleteError(context, interaction.commandName, error);
      },
    );
  } else if (interaction.isContextMenuCommand()) {
    if (DEVMODE) console.log(`Interaction originates from chat input command: "${interaction.commandName}"`);

    detectContextMenuCommand(DATA, interaction).catch(
      async (error: unknown) => {
        const context = new ContextMenuCommandContext(
          interaction,
          DATA,
        );
        await handleCommandError(context, interaction.commandName, error);
      },
    );
  } else {
    if (DEVMODE) {
      console.log(`Received interaction event of type ${interaction.type.toString()}, initiated by ${interaction.user.username}. (possibly an ActionRow event)`);
    }
  }
});

//MARK: Message
CLIENT.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  if (DEVMODE) console.log(`Received message from ${message.author.username}.`);

  const context = new MessageContext(message, DATA);
  
  detectMessageCommand(REGISTRY, DATA, message).catch(
    async (error: unknown) => {
      await handleCommandError(
        context,
        message.content.split(" ")[0].slice(BOT_PREFIX.length),
        error,
      );
    },
  );

  void REGISTRY.testInterjections(context);
});

//MARK: Delete
CLIENT.on(Events.MessageDelete, (message) => {
  if (!message.author) return;
  if (DEVMODE) console.log(`Detected message deletion from ${message.author.username}.`);

  const userSnipesEnabled = fetchConfigOption(DB, "user", "snipes", message.author.id);
  if (!userSnipesEnabled) return;

  if (message.guild) {
    const serverSnipesEnabled = fetchConfigOption(DB, "server", "snipes", message.guild.id);
    if (!serverSnipesEnabled) return;
  }

  const snipeData = {
    authorID: message.author.id,
    timestamp: message.createdTimestamp,
    content: message.content,
    imageURL: undefined,
  } as SnipedMessage;

  const attachment = message.attachments.at(0);
  if (attachment?.height) { //tests for images/videos
    snipeData.imageURL = attachment.url;
  }

  DB.channel.update(message.channel.id, "snipe", snipeData);
});

process.on("exit", (code) => {
  console.log("\nExiting with code:", code);
  DB.close();
});

CLIENT.login(BOT_TOKEN).catch(console.error);
