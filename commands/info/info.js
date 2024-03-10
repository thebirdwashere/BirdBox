const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { patchNotes } = require("../../utils/json/updates.json");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Information about the bot'),
    async execute(interaction, {embedColors, devs}) {

        const infoEmbed = new EmbedBuilder()
			.setColor(embedColors.white)
			.setTitle('Information')
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp' })
            .setDescription('(FILL THIS OUT TMR) Description of birdbox')
			.addFields(
                { name: 'Latest Version', value: patchNotes[0].version },
                { name: 'Last Updated', value: patchNotes[0].date },
				{ name: 'Credits', value: '`/credits`' },
                { name: 'Server', value: '`/neofetch`' },
				{ name: 'Github', value: 'https://github.com/grumpzalt/BirdBox' },
			)
			.setFooter({ text: 'Special thanks to users like you!' });

        await interaction.reply({ embeds: [infoEmbed] });
        
    }
}