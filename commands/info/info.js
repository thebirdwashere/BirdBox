const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { patchNotes } = require("../../utils/json/updates.json");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('General information about the bot and resources.'),
    async execute(interaction, {embedColors, prefix}) {

        const infoEmbed = new EmbedBuilder()
			.setColor(embedColors.white)
			.setTitle('Information')
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp' })
            .setDescription('A discord bot concentrating on humorous features and interactions, while also providing a couple nice utilities. The original project was created in late January 2021 using Zapier and BotGhost, and was rewritten in November 2021 using discord.js. Primarily a hobby project with pretty slow development, but we hope you get some enjoyment or even use out of it regardless!')
			.addFields(
                { name: 'Latest Version', value: patchNotes[0].version },
                { name: 'Last Updated', value: patchNotes[0].date },
				{ name: 'Credits', value: `\`${prefix}credits\`` },
                { name: 'Server', value: `\`${prefix}neofetch\`` },
				{ name: 'Github', value: 'https://github.com/grumpzalt/BirdBox' },
			)
			.setFooter({ text: 'Special thanks to users like you!' });

        await interaction.reply({ embeds: [infoEmbed] });
        
    },
    async executeClassic({message}, {embedColors, prefix}) {

        const infoEmbed = new EmbedBuilder()
			.setColor(embedColors.white)
			.setTitle('Information')
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp' })
            .setDescription('A discord bot concentrating on humorous features and interactions, while also providing a couple nice utilities. The original project was created in late January 2021 using Zapier and BotGhost, and was rewritten in November 2021 using discord.js. Primarily a hobby project with pretty slow development, but we hope you get some enjoyment or even use out of it regardless!')
			.addFields(
                { name: 'Latest Version', value: patchNotes[0].version },
                { name: 'Last Updated', value: patchNotes[0].date },
				{ name: 'Credits', value: `\`${prefix}credits\`` },
                { name: 'Server', value: `\`${prefix}neofetch\`` },
				{ name: 'Github', value: 'https://github.com/grumpzalt/BirdBox' },
			)
			.setFooter({ text: 'Special thanks to users like you!' });

        await message.reply({ embeds: [infoEmbed] });
        
    }
}