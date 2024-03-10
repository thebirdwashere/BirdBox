const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'ping',
    description: "Returns a pong if the bot is working. Useful to test if it crashed.",
    execute({message}, {client}){
		const pingEmbed = new EmbedBuilder()
			.setColor(0x0282EC)
			.addFields(
				{ name: 'Ping Time', value: `${client.ws.ping}ms`}
			)
			.setFooter({ text: 'pong you bumbling pillock' });

        message.tryreply({ embeds: [pingEmbed] });
    }
}