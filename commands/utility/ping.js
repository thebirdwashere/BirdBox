const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	jsonData: {
		"name": "ping",
		"description": "Ping the bot, get a response.",
		"integration_types": [0, 1],
		"contexts": [0, 1, 2]
	},
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping the bot, get a response.'),
	async execute(interaction, {client, embedColors}) {

		const pingEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.addFields(
				{ name: 'Ping Time', value: `${client.ws.ping}ms`}
			)
			.setFooter({ text: 'pong you bumbling pillock' });

		await interaction.reply({ embeds: [pingEmbed] });
		
	},
	async executeClassic({message}, {client, embedColors}) {

		const pingEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.addFields(
				{ name: 'Ping Time', value: `${client.ws.ping}ms`}
			)
			.setFooter({ text: 'pong you bumbling pillock' });

		await message.reply({ embeds: [pingEmbed] });
		
	}
};
