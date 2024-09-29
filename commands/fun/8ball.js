const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { randomFooter, randomMsg } = require("../../utils/scripts/util_scripts.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Magic 8ball command: ask anything, but don\'t expect a straight answer.')
        .addStringOption(option =>
			option
				.setName('message')
				.setDescription('Get a wise response...')
                .setMaxLength(1000)
				.setRequired(true)
        ),
    async execute(interaction, {embedColors}) {

        const message = interaction.options.getString('message');
        const randomResponse = randomMsg('ball')

        const responseEmbed = new EmbedBuilder()
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
            .setColor(embedColors.blue)
            .addFields(
				{ name: 'You asked:', value: `"${message}"`}
			);
        
        if (typeof randomResponse == "string") {
            responseEmbed.setTitle(randomResponse);
            responseEmbed.setFooter({ text: randomFooter('ball') });
        }

        if (randomResponse.text && randomResponse.url) {
            responseEmbed
                .setTitle(randomResponse.text)
                .setURL(randomResponse.url);
        }

        if (randomResponse.text && randomResponse.image) {
            responseEmbed
                .setTitle(randomResponse.text)
                .setImage(randomResponse.image);
        } 

        if (randomResponse.credit) {
            responseEmbed.setFooter({ text: `${randomResponse.credit} - ${randomFooter('ball')}` });
        }

        await interaction.reply({ embeds: [responseEmbed] });

    }, 
    async executeClassic({message, content}, {embedColors}) {

        if (content.length > 1000) return message.reply("bro that message is WAY too long, i aint reading allat")

        const randomResponse = randomMsg('ball')
    
        const responseEmbed = new EmbedBuilder()
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
            .setColor(embedColors.blue)
            .setFooter({ text: randomFooter('ball') });
        
        if (content) {responseEmbed.addFields({ name: 'You asked:', value: content})}
        
        if (typeof randomResponse == "string") {
            responseEmbed.setTitle(randomResponse);
            responseEmbed.setFooter({ text: randomFooter('ball') });
        }

        if (randomResponse.text && randomResponse.url) {
            responseEmbed
                .setTitle(randomResponse.text)
                .setURL(randomResponse.url);
        }

        if (randomResponse.text && randomResponse.image) {
            responseEmbed
                .setTitle(randomResponse.text)
                .setImage(randomResponse.image);
        } 

        if (randomResponse.credit) {
            responseEmbed.setFooter({ text: `${randomResponse.credit} - ${randomFooter('ball')}` });
        }

        await message.reply({ embeds: [responseEmbed] });

    }, 
}