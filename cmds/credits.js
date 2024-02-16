module.exports = {
	name: 'credits',
	description: 'Credits to the people who work/worked on this bot.',
	execute(message, args, vars) {
		const EmbedBuilder = vars.EmbedBuilder

		const creditsEmbed = new EmbedBuilder()
			.setColor(0xAA00FF)
			.setTitle('Credits')
			.setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
			.setDescription('Credits to the people who work/worked on this bot.')
			.addFields(
				{ name: 'Owner', value: 'TheBirdWasHere' },
				{ name: 'Host', value: 'TheBirdWasHere' },
				{ name: 'Contributors', value: 'Bisly, AgentNebulator' }
			)
			.setFooter({ text: 'Special thanks to users like you!' });
		message.channel.trysend({ embeds: [creditsEmbed] });
	}
}
