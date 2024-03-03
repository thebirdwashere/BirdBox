const responsesObj = require('../../utils/json_info/8ball_responses.json');
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Magic 8ball command.')
        .addStringOption(option =>
			option
				.setName('message')
				.setDescription('Get a wise response...')
                .setMaxLength(1024)
				.setRequired(true)
        ),
    async execute(interaction, {embedColor}) {

        const responses = responsesObj.responses;
        const message = interaction.options.getString('message');

        const responseEmbed = new EmbedBuilder()
            .setTitle(responses[Math.floor(Math.random() * responses.length)])
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
            .setColor(embedColor)
            .addFields(
				{ name: 'You asked:', value: `"${message}"`}
			)
            .setFooter({ text: 'i be like that wise tree fr fr' });

        await interaction.reply({ embeds: [responseEmbed] });

    }
}