const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('maybepile')
		.setDescription('Take a look at and suggest potential features!'),
    async execute(interaction) {

        interaction.reply(`The command \`/maybepile\` does not support Modern mode yet.`);

    }
}