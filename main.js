/* --- {BirdBox Unified} --- *
 *         Authors:          *
 *      thebirdwashere       *
 *      agentnebulator       *
 *          bislij           *
 *         umadkek?          *
 * Last Modified: 08/01/2024 */

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
const classicPrefix = 'e;';
const defaults = require('./utils/json/defaults.json');
const devs = require('./utils/json/devs.json');
const messageTests = require("./utils/scripts/message_tests.js");
const { getSettingValue } = require("./utils/scripts/util_scripts.js");

/* VARS PASSED TO COMMANDS */

let vars = {
    db: db,
    client: client,
	devs: devs,
	admins: devs.developer.concat(devs.host),
	embedColors: {
		blue: 0x5282EC,
		green: 0x03FC30,
		red: 0xFF0000,
		yellow: 0xFFE600,
		white: 0xFFFFFF,
		purple: 0x900099
	},
	//TODO: Add config option for setting color in database
	Discord: Discord
};

module.exports = { vars: vars };

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

		command.category = path.dirname(filePath).split('/').pop();

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

/* COOLDOWN HANDLER */

client.cooldowns = new Collection();

for (const command of client.commands) {
	client.cooldowns.set(command[0], {})
}

/* FOR HELP COMMAND */

let commands = Array.from(client.commands.values());
commands = commands.filter((item) => { if (item.data.options) return item; });

commands.sort((a, b) => { // Put commands in alphabetical order.
	if (a.data.name < b.data.name) return -1 
	else if (a.data.name > b.data.name) return 1 
	else return 0
});

vars.commands = commands;

/* ON READY */

client.once(Events.ClientReady, async () => {
    console.log('BirdBox Unified is now online!');
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Logs will be shown in this terminal.');

    let status = await db.get("settings.status") || defaults.status;

    client.user.setPresence({ activities: [{ name: status, type: ActivityType.Custom }] });
});

/* INTERACTION HANDLER */

client.on(Events.InteractionCreate, async (interaction) => {

	if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		vars.prefix = '/'; // Pass the proper prefix to slash commands.

		if (typeof command.filter === 'object') { // Permission filter for commands. Defined in the module.exports on a command-by-command basis.

			const commandFilter = interaction.options.data.find(option => option.type == 1) ? command.filter[interaction?.options?.getSubcommand?.()] : command.filter
			let authorized = [];

			if (commandFilter !== "all") {
				commandFilter?.forEach(item => {
					if (!devs[item]) return;
					let usersWithPermission = devs[item].map(item => item.userId);
					authorized = authorized.concat(usersWithPermission);
				});
	
				if (authorized.length == 0) return interaction.reply({ content: `The permission levels for this command are empty or are not valid. Please contact a developer.`, ephemeral: true });
				if (!authorized.includes(interaction.user.id)) {
					const permissionLevelFormatter = new Intl.ListFormat("en", { type: "disjunction" })
					const permissionLevels = permissionLevelFormatter.format(commandFilter.map(item => `\`${item}\``))
					return interaction.reply({ content: `You do not have the required permission level to use this command. This command requires a permisson level of ${permissionLevels}. If you believe this is an error, please contact a developer.`, ephemeral: true });
				}
			}

		} else if (command.filter) { return interaction.reply({ content: `The permission levels for this command have been incorrectly configured. Please contact a developer.`, ephemeral: true }); }

		if (typeof(command.cooldown) === "number" || typeof(command.cooldown) === "object") {
			
			const cooldowns = client.cooldowns.get(command.data.name)
			const lastUsedTime = cooldowns[interaction.user.id] ?? 0
			const currentTime = Date.now()
			const cooldownTime = interaction.options.data.find(option => option.type == 1) ? command.cooldown[interaction?.options?.getSubcommand?.()] : (command.cooldown ?? 0)

			const userIsAdmin = vars.admins.map(user => user.userId).includes(interaction.user.id)

			if (((currentTime - lastUsedTime) < cooldownTime) && !userIsAdmin) {
				const timeWhenAvailable = Math.floor((lastUsedTime + cooldownTime) / 1000)
				return interaction.reply({ content: `You're going too fast! This command will be available <t:${timeWhenAvailable}:R>`, ephemeral: true });
			} else {
				cooldowns[interaction.user.id] = currentTime
				client.cooldowns.set(command, cooldowns)
			}

		} else if (command.cooldown) { return interaction.reply({ content: `The cooldown for this command has been incorrectly configured. Please contact a developer.`, ephemeral: true }); }

		try { // Attempt to execute the command. If failure occurs, handle accordingly.
			await command.execute(interaction, vars);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }) }
			else { await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }) }
		}

	} else if (interaction.isAutocomplete()) {
		
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try { await command.autocomplete(interaction, vars); } catch (error) { console.error(error); }

	} else if (interaction.isModalSubmit()) { //TODO: this is hardcoded to only work with bot settings, figure out some way around that
		if (interaction.customId == "settingsModal") {
			const enteredField = interaction.fields.fields.first()
			await interaction.deferUpdate();

			await db.set(`settings.${enteredField.customId}`, enteredField.value);

			if (enteredField.customId == "status") {
				client.user.setPresence({ activities: [{ name: enteredField.value, type: ActivityType.Custom }] });
			}
		}

	}

});

/* ON MESSAGE CREATION */

client.on(Events.MessageCreate, async (message) => {
    if (message.author.id == client.user.id) return;
    if (!message.content) return;

	if (message.content.startsWith(classicPrefix)) {
		
		let commandFormatted = message.content;

		const strings = message.content.match(/(?<=")(.*?)(?=")/g)?.filter(item => item.trim() != '') ?? [];
		strings.forEach((item) => {commandFormatted = commandFormatted.replaceAll(`"${item}"`, '');});

		const args = commandFormatted.slice(classicPrefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
		const content = message.content.replace(`${classicPrefix}${command}`, "").trim()

        if (client.commands.has(command)) {

			if (typeof(client.commands.get(command).filter) === 'object') { // Permission filter for commands. Defined in the module.exports on a command-by-command basis.
				if (!(Object.values(client.commands.get(command).filter) && !args[0])) { //check for a case where the user used a command with subcommands but didn't add a subcommand
					const commandFilter = client.commands.get(command).filter[args[0]] ?? client.commands.get(command).filter
					let authorized = [];
	
					if (commandFilter !== "all") {
						commandFilter?.forEach?.(item => {
							if (!devs[item]) return;
							let usersWithPermission = devs[item].map(item => item.userId);
							authorized = authorized.concat(usersWithPermission);
						});
			
						if (authorized.length == 0) return message.reply(`The permission levels for this command are empty or are not valid. Please contact a developer.`);
						if (!authorized.includes(message.author.id)) {
							const permissionLevelFormatter = new Intl.ListFormat("en", { type: "disjunction" })
							const permissionLevels = permissionLevelFormatter.format(commandFilter.map(item => `\`${item}\``))
							return message.reply(`You do not have the required permission level to use this command. This command requires a permisson level of ${permissionLevels}. If you believe this is an error, please contact a developer.`);
						}
					}
				}
			} else if (client.commands.get(command).filter) { return message.reply(`The permission levels for this command have been incorrectly configured. Please contact a developer.`); }

			if (typeof(client.commands.get(command).cooldown) === "number" || typeof(client.commands.get(command).cooldown) === "object") {

				const cooldowns = client.cooldowns.get(command)
				const lastUsedTime = cooldowns[message.author.id] ?? 0
				const currentTime = Date.now()
				const cooldownTime = client.commands.get(command).cooldown[args[0]] ?? client.commands.get(command).cooldown ?? 0

				const userIsAdmin = vars.admins.map(user => user.userId).includes(message.author.id)
	
				if ((currentTime - lastUsedTime) < cooldownTime && !userIsAdmin) {
					const timeWhenAvailable = Math.floor((lastUsedTime + cooldownTime) / 1000)
					return message.reply(`You're going too fast! This command will be available <t:${timeWhenAvailable}:R>`);
				} else {
					cooldowns[message.author.id] = currentTime
					client.cooldowns.set(command, cooldowns)
				}
	
			} else if (client.commands.get(command).cooldown) { return message.reply(`The cooldown for this command has been incorrectly configured. Please contact a developer.`); }

			try {
				vars.prefix = classicPrefix;

				client.commands.get(command).executeClassic({message, args, strings, content}, vars);
			} catch (err) {
				message.reply(`The command \`/${command}\` does not support Classic mode yet.`);
			}

			//console.log(client.cooldowns)

			return;
		} else {
			message.reply(`The command \`${classicPrefix}${command}\` was not found.`);
		};
		
		return;
	}

	for (const [_, test] of Object.entries(messageTests)) {
		const testResult = await test.check({message, vars})
		if (testResult) {
			console.log("Message test passed: \n", message.content, "\n", testResult)
			await test.respond({message, vars, testResult})
		}
	}
});

/* ON MESSAGE DELETION */

client.on(Events.MessageDelete, async (message) => {
    if (!message.author || !message.createdAt) return; // Don't log broken messages.
	
	const userSnipesSetting = await getSettingValue(`settings.snipes.${message.author.id}`, db)
	const serverSnipesSetting = await getSettingValue(`settings.server_snipes.${message.guild.id}`, db)

	if (!userSnipesSetting || !serverSnipesSetting) return; //Don't log when members opt out.

	console.log("Snipe settings:", userSnipesSetting, serverSnipesSetting)

	await db.set(`snipe_${message.channelId}`, {
		content: message?.content,
		author: {tag: message.author.tag, id: message.author.id},
        timestamp: message.createdAt,
        attachment: message.attachments.first()?.url // Grabs the first attachment url out of the message.
	})
})

/* here we go... */
client.login(token);
