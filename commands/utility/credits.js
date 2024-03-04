const devArray = require('../../utils/json/devs.json');
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('credits')
		.setDescription('Credits to the people who work/worked on this bot.'),
    async execute(interaction, {embedColor}) {

        const creditsEmbed = new EmbedBuilder()
			.setColor(embedColor)
			.setTitle('Credits')
			.setDescription('Credits to the people who work/worked on this bot.')
			.addFields(
				{ name: 'Host', value: devArray.host[0].name },
				{ name: 'Developers', value: devArray.developer.map(item => item.name).join(", ") },
				{ name: 'Contributors', value: devArray.contributor.map(item => item.name).join(", ") },
				{ name: 'Bot Testers', value: devArray.botTester.map(item => item.name).join(", ") },
				{ name: 'Other', value: devArray.misc.map(item => item.name).join(", ") }
			)
			.setFooter({ text: 'Special thanks to users like you!' });

        await interaction.reply({ embeds: [creditsEmbed] });
        
    }
}