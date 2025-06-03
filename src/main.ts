import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import "dotenv/config";
import { panic } from "./utility/utility.js";
import { CommandRegistry, isSubcommandArray } from "./utility/command.js";
import {
  ChatInputCommandInteractionContext,
  MessageContext,
} from "./utility/context.js";
import perms from "./data/perms.json" with { type: "json" };
import { Perms } from "./utility/types.js";
import { handleError } from "./utility/error.js";

// Define top-level constants
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
  console.log("Birdbox Rewrite is now online!");
  console.log(
    `Logged in as ${CLIENT.user?.tag ?? "(failed to retrieve tag)"}!`,
  );
  console.log("Logs will be shown in this terminal.");

  REGISTRY.registerAll(BOT_TOKEN, BOT_ID).catch(console.error);
});

CLIENT.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) {
    const commandName = interaction.commandName;
    const command = REGISTRY.commands.get(commandName);
    if (command === undefined) return;
    // command: Command

    const context = new ChatInputCommandInteractionContext(interaction, DATA);
    if (command.execute !== undefined) {
      command.execute(context).catch(async (error: unknown) => {
        await handleError(context, commandName, error);
      });
    } else if (command.body !== undefined && isSubcommandArray(command.body)) {
      const subcommandName = interaction.options.getSubcommand();
      const subcommand = command.body.find(
        (sub) => sub.data.name === subcommandName,
      );

      if (subcommand) {
        subcommand.execute(context).catch(async (error: unknown) => {
          await handleError(context, commandName, error);
        });
      } else {
        panic("Unknown subcommand.");
      }
    } else {
      console.log(command.body);
      panic(`Command is missing a required execute method: /${commandName}.`);
    }
  }
});

CLIENT.on(Events.MessageCreate, (message) => {
  try {
    if (message.content.length === 0) return;
    if (!message.content.startsWith(BOT_PREFIX)) return;

    const options = message.content
      .split(/\s/)
      .filter((str) => str.length !== 0);
    const commandName = options.shift()?.slice(BOT_PREFIX.length);
    if (commandName === undefined) return;
    // commandName: string

    const command = REGISTRY.commands.get(commandName);
    if (command === undefined) return;
    // command: Command

    const context = new MessageContext(message, DATA);
    if (command.execute !== undefined) {
      command.execute(context).catch(async (error: unknown) => {
        await handleError(context, commandName, error);
      });
    } else if (command.body !== undefined && isSubcommandArray(command.body)) {
      const subcommandName = options.shift();
      if (subcommandName === undefined)
        void handleError(
          context,
          commandName,
          "This command requires a subcommand.",
        );

      const subcommand = command.body.find(
        (sub) => sub.data.name === subcommandName,
      );

      if (subcommand) {
        subcommand.execute(context).catch(async (error: unknown) => {
          await handleError(context, commandName, error);
        });
      } else {
        void handleError(context, commandName, "Unknown subcommand.");
      }
    } else {
      console.log(command.body);
      panic(`Command is missing a required execute method: /${commandName}.`);
    }
  } catch (error) {
    console.error(error);
  }
});

CLIENT.login(BOT_TOKEN).catch(console.error);
