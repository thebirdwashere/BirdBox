const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pinging command for birdbox.'),
	async execute(interaction) {
		await interaction.reply('pong you bumbling pillock');
	}
};
