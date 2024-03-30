const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('responses')
		.setDescription('Adds and deletes bot message responses.'),
    async execute(interaction) {

        interaction.reply(`The command \`/reponses\` does not support Modern mode yet.`);

    }
}