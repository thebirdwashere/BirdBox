const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('credits')
		.setDescription('Give some due credit to the people who worked on this bot.'),
    async execute(interaction, {embedColors, devs}) {

        const creditsEmbed = new EmbedBuilder()
			.setColor(embedColors.white)
			.setTitle('Credits')
			.setDescription('Credits to the people who work/worked on this bot.')
			.addFields(
				{ name: 'Host', value: devs.host[0].name },
				{ name: 'Developers', value: devs.developer.map(item => item.name).join(", ") },
				{ name: 'Contributors', value: devs.contributor.map(item => item.name).join(", ") },
				{ name: 'Bot Testers', value: devs.botTester.map(item => item.name).join(", ") },
				{ name: 'Other', value: devs.misc.map(item => item.name).join(", ") }
			)
			.setFooter({ text: 'And an extra-special thanks to users like you!' });

        await interaction.reply({ embeds: [creditsEmbed] });
        
    },
	async executeClassic({message}, {embedColors, devs}) {

        const creditsEmbed = new EmbedBuilder()
			.setColor(embedColors.white)
			.setTitle('Credits')
			.setDescription('Credits to the people who work/worked on this bot.')
			.addFields(
				{ name: 'Host', value: devs.host[0].name },
				{ name: 'Developers', value: devs.developer.map(item => item.name).join(", ") },
				{ name: 'Contributors', value: devs.contributor.map(item => item.name).join(", ") },
				{ name: 'Bot Testers', value: devs.botTester.map(item => item.name).join(", ") },
				{ name: 'Other', value: devs.misc.map(item => item.name).join(", ") }
			)
			.setFooter({ text: 'And an extra-special thanks to users like you!' });

        await message.reply({ embeds: [creditsEmbed] });
        
    }
}