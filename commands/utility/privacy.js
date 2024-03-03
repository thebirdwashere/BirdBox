const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('privacy')
		.setDescription('Privacy notice of information on data management.'),
    async execute(interaction, {embedColor}) {

        const privacyEmbed = new EmbedBuilder()
			.setColor(embedColor)
			.setTitle('Privacy Policy')
			.setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
			.setDescription('Click the link for more information about the data BirdBox stores, how it is stored, and the license BirdBox uses.')
			.setURL('https://thebirdwashere.thejasperhouse.net/birdbox/privacy.html');

        await interaction.reply({ embeds: [privacyEmbed] });
        
    }
}