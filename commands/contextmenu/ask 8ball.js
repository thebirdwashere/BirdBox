const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');
const { randomFooters, randomMsg } = require("../../utils/scripts/util_scripts.js");

module.exports = {
    data: new ContextMenuCommandBuilder()
		.setName('ask 8ball')
        .setType(ApplicationCommandType.Message),
    async execute(interaction, {embedColors}) {

        const targetMessageContent = interaction.targetMessage.content

        const responseEmbed = new EmbedBuilder()
            .setTitle(randomMsg('ball'))
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256' })
            .setColor(embedColors.blue)
            .addFields(
				{ name: 'You asked:', value: `"${targetMessageContent}"`}
			)
            .setFooter({ text: randomFooters('ball') });

        await interaction.reply({ embeds: [responseEmbed] });

    },
    async executeClassic({message}, {prefix}) {
        //they'll never know (not that they should see this anyway)
        message.reply(`The command \`${prefix}ask 8ball\` was not found.`)
    }
}