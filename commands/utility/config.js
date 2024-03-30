const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Command to configure server and client settings.'),
    async execute(interaction) {

        interaction.reply(`The command \`/config\` does not support Modern mode yet.`);

    }
}