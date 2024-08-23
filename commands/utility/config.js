const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Configure and customize BirdBox per user or per server.'),
    async execute(interaction) {

        interaction.reply(`The command \`/config\` does not support Modern mode yet.`);

    }
}