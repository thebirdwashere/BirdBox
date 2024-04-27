const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
   .setName("announce")
   .setDescription("Announce to another channel. May be disabled depending on server.")
   .addStringOption(option => option.setName("message").setDescription("The message to announce").setRequired(true))
   .addChannelOption(option => option.setName("channel").setDescription("The channel to announce in").setRequired(true)),
  async execute(interaction, { db }) {
    await interaction.deferReply();

    const channelId = interaction.options.getChannel("channel").id;
    await db.set(`settings_announce_channel_${interaction.guildId}`, channelId);

    let announce_channel = await db.get(`settings_announce_channel_${interaction.guildId}`);

    if (!announce_channel) {
      interaction.editReply({ content: `announce disable 1`, ephemeral: true});
      return;
    }

    try {
      const channel = interaction.guild.channels.cache.get(announce_channel);
      if (!channel) {
        interaction.editReply({ content: `announce disable 2`, ephemeral: true});
        return;
      }
      announce_channel = channel;
    } catch {
      interaction.editReply({ content: `announce disable 2`, ephemeral: true});
      return;
    }

    if (!announce_channel.id) {
      interaction.editReply({ content: `announce disable 3`, ephemeral: true});
      return;
    }

    const announceEmbed = new EmbedBuilder()
     .setTitle(`${interaction.channel.name}'s Announcement`)
     .setDescription(interaction.options.getString("message").trim())
     .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
     .setColor(0xAA00FF)
     .setTimestamp(interaction.createdTimestamp);

    announce_channel.send({ embeds: [announceEmbed] }).then(() => {
      interaction.editReply({ content: "Announcement sent!", ephemeral: true });
    }).catch((error) => {
      interaction.editReply({ content: `Error sending announcement: ${error}`, ephemeral: true });
    });
  }
}
