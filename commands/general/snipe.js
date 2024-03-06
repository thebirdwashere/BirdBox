const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { randomFooters } = require("../../utils/scripts/util_scripts.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('snipe')
		.setDescription('Fetches last deleted message in a channel and displays it.'),
    async execute(interaction, {db, embedColors}) {

        const snipe = await db.get(`snipe_${interaction.channel.id}`);

        if (!snipe) return interaction.reply({ content: 'this command is garbage apparently cause i cant find a dang thing here', ephemeral: true }); // TODO: MAKE EPHEMERAL A CONFIG OPTION
        if (!snipe.timestamp || !snipe.author) return interaction.reply({ content:'this command is garbage apparently cause the snipe i got is busted',  ephemeral: true });

        const sniped = await interaction.guild.members.fetch(snipe.author.id);
        const messageDate = new Date(snipe.timestamp);

        const snipeEmbed = new EmbedBuilder()
            .setTitle(`Deleted from: #${interaction.channel.name}`)
            .setAuthor({ name: snipe.author.tag, iconURL: sniped.displayAvatarURL() })
            .setColor(embedColors.blue)
            .setFooter({ text: randomFooters('snipe') })
            .setTimestamp(messageDate);

        if (snipe.content) snipeEmbed.setDescription(snipe.content);
        if (snipe.attachment) snipeEmbed.setImage(snipe.attachment);

        await interaction.reply({ embeds: [snipeEmbed] });

    }
}