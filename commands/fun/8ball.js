const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { randomFooters, randomMsg } = require("../../utils/scripts/util_scripts.js");

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
    async execute(interaction, {embedColors}) {

        const message = interaction.options.getString('message');

        const responseEmbed = new EmbedBuilder()
            .setTitle(randomMsg('ball'))
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
            .setColor(embedColors.blue)
            .addFields(
				{ name: 'You asked:', value: `"${message}"`}
			)
            .setFooter({ text: randomFooters('ball') });

        await interaction.reply({ embeds: [responseEmbed] });

    }
}