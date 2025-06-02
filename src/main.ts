import { Client, Events, GatewayIntentBits } from "discord.js";
import path from "path";
import "dotenv/config";
import yaml from "yaml";
import { promises as fs } from "fs";
import { panic } from "./utility/utility.js";
import { CommandRegistry, isSubcommandArray } from "./utility/command.js";
import {
  ChatInputCommandInteractionContext,
  MessageContext,
} from "./utility/context.js";

// Define top-level constants
const BOT_TOKEN =
  process.env.BOT_TOKEN ?? panic("Failed to find BOT_TOKEN in environment.");
const BOT_ID =
  process.env.BOT_ID ?? panic("Failed to find BOT_ID in environment.");
const PREFIX = "t;";
const PERMS = yaml.parse(
  await fs.readFile(
    path.join(import.meta.dirname, "src/data/perms.yaml"),
    "utf-8",
  ),
);
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
  prefix: PREFIX,
  perms: PERMS,
  registry: REGISTRY,
  client: CLIENT,
};

REGISTRY.detectAll(path.join(import.meta.dirname, "commands"));

CLIENT.on(Events.ClientReady, async (_) => {
  console.log("BirdBox Unified is now online!");
  console.log(
    `Logged in as ${CLIENT.user?.tag ?? "(failed to retrieve tag)"}!`,
  );
  console.log("Logs will be shown in this terminal.");

  await REGISTRY.registerAll(BOT_TOKEN, BOT_ID);
});

CLIENT.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const commandName = interaction.commandName;
    const command = REGISTRY.commands.get(commandName);
    if (command === undefined) return;
    // command: Command

    console.log(command);

    if (command.execute !== undefined) {
      command.execute(
        new ChatInputCommandInteractionContext(interaction, DATA),
      );
    } else if (command.body !== undefined && isSubcommandArray(command.body)) {
      const subcommandName = interaction.options.getSubcommand();
      const subcommand = command.body.find(
        (sub) => sub.data.name === subcommandName,
      );

      if (subcommand) {
        await subcommand.execute(
          new ChatInputCommandInteractionContext(interaction, DATA),
        );
      } else {
        panic("Unknown subcommand.");
      }
    } else {
      console.log(command.body);
      panic(`Command is missing a required execute method: /${commandName}.`);
    }
  }
});

CLIENT.on(Events.MessageCreate, async (message) => {
  try {
    if (message.content.length === 0) return;
    if (!message.content.startsWith(PREFIX)) return;

    const options = message.content
      .split(/\s/)
      .filter((str) => str.length !== 0);
    const commandName = options.shift()?.slice(2);
    if (commandName === undefined) return;
    // commandName: string

    const command = REGISTRY.commands.get(commandName);
    if (command === undefined) return;
    // command: Command

    if (command.execute !== undefined)
      command.execute(new MessageContext(message, DATA));
  } catch (error) {
    console.error(error);
  }
});

CLIENT.login(BOT_TOKEN).catch(console.error);
