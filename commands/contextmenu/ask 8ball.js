const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { randomFooter, randomMsg } = require("../../utils/scripts/util_scripts.js");

module.exports = {
    data: new ContextMenuCommandBuilder()
		.setName('ask 8ball')
        .setType(ApplicationCommandType.Message),
    async execute(interaction, {embedColors}) {

        const targetMessageContent = interaction.targetMessage.content
        const randomResponse = randomMsg('ball')

        const responseEmbed = new EmbedBuilder()
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
            .setColor(embedColors.blue)
            .addFields(
                { name: 'You asked:', value: targetMessageContent}
            )
            .setFooter({ text: randomFooter('ball') });
        
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
    async executeClassic({message}, {prefix}) {
        //they'll never know (not that they should see this anyway)
        message.reply(`The command \`${prefix}ask 8ball\` was not found.`)
    }
}