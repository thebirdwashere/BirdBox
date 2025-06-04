import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";

import "dotenv/config";

import perms from "./data/perms.json" with { type: "json" };

import { panic } from "./utility/utility.js";
import { handleError } from "./utility/error.js";
import { CommandRegistry } from "./utility/command.js";
import {
  ChatInputCommandInteractionContext,
  MessageContext,
} from "./utility/context.js";
import {
  detectChatInputInteractionCommand,
  detectMessageCommand,
} from "./utility/process.js";
import { Perms } from "./utility/types.js";

const BOT_TOKEN =
  process.env.BOT_TOKEN ?? panic("Failed to find BOT_TOKEN in environment.");
const BOT_ID =
  process.env.BOT_ID ?? panic("Failed to find BOT_ID in environment.");
const BOT_PREFIX =
  process.env.BOT_PREFIX ?? panic("Failed to find BOT_PREFIX in environment.");
const PERMS = perms as Perms;
const CLIENT = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
});
const REGISTRY = new CommandRegistry();
const DATA = {
  prefix: BOT_PREFIX,
  perms: PERMS,
  registry: REGISTRY,
  client: CLIENT,
};

await REGISTRY.detectAll(path.join(import.meta.dirname, "commands"));

CLIENT.on(Events.ClientReady, (_event) => {
  console.log("Birdbox Rewrite is now online.");
  console.log(`Logged in as ${CLIENT.user?.tag ?? "(undefined)"}.`);
  console.log("Logs will be shown in this terminal.");

  REGISTRY.registerAll(BOT_TOKEN, BOT_ID).catch(console.error);
});

CLIENT.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) {
    detectChatInputInteractionCommand(REGISTRY, DATA, interaction).catch(
      async (error: unknown) => {
        const context = new ChatInputCommandInteractionContext(
          interaction,
          DATA,
        );
        await handleError(context, interaction.commandName, error);
      },
    );
  }
});

CLIENT.on(Events.MessageCreate, (message) => {
  detectMessageCommand(REGISTRY, DATA, message).catch(
    async (error: unknown) => {
      const context = new MessageContext(message, DATA);
      await handleError(
        context,
        message.content.split(" ")[0].slice(BOT_PREFIX.length),
        error,
      );
    },
  );
});

CLIENT.login(BOT_TOKEN).catch(console.error);
