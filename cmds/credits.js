const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: 'credits',
	description: 'View the credits for this bot. It\'s pretty obvious what it does.',
	execute({message}, {devArray}) {
		const creditsEmbed = new EmbedBuilder()
			.setColor(0xAA00FF)
			.setTitle('Credits')
			.setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
			.setDescription('Credits to the people who work/worked on this bot.')
			.addFields(
				{ name: 'Host', value: devArray.host[0].name },
				{ name: 'Developers', value: devArray.developer.map(item => item.name).join(", ") },
				{ name: 'Bot Testers', value: devArray.botTester.map(item => item.name).join(", ") }
			)
			.setFooter({ text: 'Special thanks to users like you!' });
		message.tryreply({ embeds: [creditsEmbed] });
	}
}
