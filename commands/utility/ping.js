const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pinging command for birdbox.'),
	async execute(interaction, {client, embedColor}) {

		const pingEmbed = new EmbedBuilder()
			.setColor(embedColor)
			.addFields(
				{ name: 'Ping Time', value: `${client.ws.ping}ms`}
			)
			.setFooter({ text: 'pong you bumbling pillock' });

		await interaction.reply({ embeds: [pingEmbed] });
		
	}
};
