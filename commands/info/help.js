const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Returns a list of commands with command descriptions.'),
    async execute(interaction, {embedColors, commands, prefix}) {

        commandsArray = commands.map(item => ({
            name: `${prefix}${item.data.name}  ${item.data.options.map(item => `\`${item.name}\``).join(' ')}`,
            value: item.data.description,
            inline: true
        }));

        const helpEmbed = new EmbedBuilder()
            .setTitle('Commands and Info')
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
			.setColor(embedColors.white)
            .setDescription(`Learn about this bot's capabilities.`)
			.addFields(...commandsArray)
			.setFooter({ text: 'Special thanks to users like you!' });

        await interaction.reply({ embeds: [helpEmbed] });
        
    },
    async executeClassic({message}, {embedColors, commands, prefix}) {

        commandsArray = commands.map(item => ({
            name: `${prefix}${item.data.name}  ${item.data.options.map(item => `\`${item.name}\``).join(' ')}`,
            value: item.data.description,
            inline: true
        }));

        const helpEmbed = new EmbedBuilder()
            .setTitle('Commands and Info')
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
			.setColor(embedColors.white)
            .setDescription(`Learn about this bot's capabilities.`)
			.addFields(...commandsArray)
			.setFooter({ text: 'Special thanks to users like you!' });

        await message.reply({ embeds: [helpEmbed] });
        
    }
}