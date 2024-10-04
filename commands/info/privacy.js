const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('privacy')
		.setDescription('Privacy notice of information on data management.'),
    async execute(interaction, {embedColors}) {

        const privacyEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.setTitle('Privacy Policy')
			.setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
			.setFooter({text: 'User data and license information.'})
			.setURL('https://thebirdwashere.com/birdbox/privacy.html');
		
		const linkButton = new ButtonBuilder()
			.setLabel('Link')
			.setStyle(ButtonStyle.Link)
			.setDisabled(false)
			.setURL('https://thebirdwashere.com/birdbox/privacy.html');
		
		const linkButtonRow = new ActionRowBuilder()
			.addComponents(linkButton);

        await interaction.reply({ embeds: [privacyEmbed], components: [linkButtonRow] });
        
    },
	async executeClassic({message}, {embedColors}) {

        const privacyEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.setTitle('Privacy Policy')
			.setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
			.setFooter({text: 'User data and license information.'})
			.setURL('https://thebirdwashere.com/birdbox/privacy.html');

        await message.reply({ embeds: [privacyEmbed] }).catch(e => console.error(e));
        
    }
}