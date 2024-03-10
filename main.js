/* --- {BirdBox Unified} --- *
 *         Authors:          *
 *      thebirdwashere       *
 *      agentnebulator       *
 *          bislij           *
 *                           *
 * Last Modified: 03/02/2024 */

/* Requires the file with the Discord Bot Token. If you have cloned this repo, it will not have the file, so add a file named ".env" and put DISCORD_TOKEN=yourbottokennumberhere inside of it. */
require('dotenv').config();

/* IMPORTANT REQUIREMENTS */

const Discord = require('discord.js');
const { Client, Collection, Events, GatewayIntentBits, Message, MessageEmbed, DiscordAPIError, ActivityType, EmbedBuilder, REST, Routes } = require('discord.js');
const client = new Client({intents : [GatewayIntentBits.GuildMessages , GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]}); // Perms BirdBox needs.
const fs = require('fs');
const path = require('path');
const token = process.env.DISCORD_TOKEN;
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const prefix = 'e;';
const defaults = require('./utils/json/defaults.json');
const devs = require('./utils/json/devs.json');

/* VARS PASSED TO COMMANDS */

let vars = {
    db: db,
    client: client,
	prefix: prefix,
	devs: devs,
	embedColors: {
		blue: 0x5282EC,
		green: 0x03FC30,
		red: 0xFF0000,
		yellow: 0xFFE600,
		white: 0xFFFFFF
	}
	//TODO: Add config option for setting color in database
};

/* SLASH COMMAND HANDLER */

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

/* FOR HELP COMMAND */

let commands = Array.from(client.commands.values());
commands = commands.map(item => ({
	name: `/${item.data.name}  ${item.data.options.map(item => `\`${item.name}\``).join(' ')}`,
	value: item.data.description,
	inline: true
}));

vars.commands = commands;

/* ON READY */

client.once('ready', async () => {
    console.log('BirdBox Unified is now online!');
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Logs will be shown in this terminal.');

    let status = await db.get("status") || defaults.status;

    client.user.setPresence({
        activities: [{ name: status, type: ActivityType.Custom }]
    });
});

/* ON SLASH COMMAND INTERACTION - INTERACTION HANDLER */

client.on(Events.InteractionCreate, async (interaction) => {

	if (interaction.isChatInputCommand()) {

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction, vars);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}

	} else if (interaction.isAutocomplete()) {
		
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try { await command.autocomplete(interaction); } catch (error) { console.error(error); }

	}

});

/* ON MESSAGE CREATION */

client.on('messageCreate', async (message) => {
    if (message.author.id == client.user.id) {return;}
    if (!message.content) {return;}
});

/* ON MESSAGE DELETION */

client.on('messageDelete', async (message) => {
    if (!message.author || !message.createdAt) return; // Don't log broken messages.

	await db.set(`snipe_${message.channelId}`, {
		content: message?.content,
		author: {tag: message.author.tag, id: message.author.id},
        timestamp: message.createdAt,
        attachment: message.attachments.first()?.url // Grabs the first attachment url out of the message.
	})
})

/* here we go... */
client.login(token);