const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('announce')
		.setDescription('Announce something to a designated channel.'),
    async execute(interaction) {

        interaction.reply(`The command \`/announce\` does not support Modern mode yet.`);

    }
}