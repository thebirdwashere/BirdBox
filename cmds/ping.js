const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'ping',
    description: "ping pong command",
    execute({message}, {client}){
		const pingEmbed = new EmbedBuilder()
			.setColor(0x0282EC)
			.addFields(
				{ name: 'Ping Time', value: `${client.ws.ping}ms`}
			)
			.setFooter({ text: 'pong you bumbling pillock' });

        message.reply({ embeds: [pingEmbed] });
    }
}