import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";

import "dotenv/config";

import perms from "./data/perms.json" with { type: "json" };

import { panic } from "./utility/utility.js";
import { handleCommandError } from "./utility/error.js";
import { Registry } from "./utility/registry.js";
import {
  ChatInputCommandInteractionContext,
  MessageContext,
} from "./utility/context.js";
import {
  detectChatInputInteractionCommand,
  detectMessageCommand,
  handleAutocomplete,
} from "./utility/process.js";
import { Data, Perms, SnipedMessage } from "./utility/types.js";

import { Database } from "./utility/database.js";

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
};

await REGISTRY.detectCommands(path.join(import.meta.dirname, "commands"));
await REGISTRY.detectInterjections(path.join(import.meta.dirname, "interjections"));

CLIENT.on(Events.ClientReady, (_event) => {
  console.log("Birdbox Rewrite is now online.");
  console.log(`Logged in as ${CLIENT.user?.tag ?? "(undefined)"}.`);
  console.log("Logs will be shown in this terminal.");

  REGISTRY.registerCommands(BOT_TOKEN, BOT_ID).catch(console.error);
});

CLIENT.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) {
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
    void handleAutocomplete(DATA, interaction);
  }
});

CLIENT.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;

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

CLIENT.on(Events.MessageDelete, (message) => {
  //TODO: Add config consent here
  const snipeData = {
    authorID: message.author?.id,
    timestamp: message.createdTimestamp,
    content: message.content,
    imageURL: null,
  } as SnipedMessage;

  const attachment = message.attachments.at(0);
  if (attachment?.height) { //tests for images/videos
    snipeData.imageURL = attachment.url;
  }

  DB.channel.update(message.channel.id, "snipe", snipeData);
  
  console.log(DB.channel.fetch(message.channel.id, "snipe"));
});

process.on("exit", (code) => {
  console.log("\nExiting with code:", code);
  DB.close();
});

CLIENT.login(BOT_TOKEN).catch(console.error);
