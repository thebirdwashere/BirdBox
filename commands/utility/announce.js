const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Echo a message to another channel.")
    .addStringOption(option => 
      option
        .setName("message")
        .setDescription("The message to announce")
        .setRequired(true)
    )
    .addChannelOption(option => 
      option
        .setName("channel")
        .setDescription("The channel to announce in")
        .addChannelTypes(
          ChannelType.GuildText, 
          ChannelType.GuildVoice, 
          ChannelType.GuildAnnouncement, 
          ChannelType.AnnouncementThread,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.GuildStageVoice
      )
  ),
  async execute(interaction, { db }) {
    await interaction.deferReply();

    let announce_channel = interaction.options?.getChannel("channel")?.id ?? (await db.get(`setting_announce_channel_${interaction.guildId}`) ?? interaction.channelId);

    if (!announce_channel) {
      return interaction.editReply({ content: `announce disable 1`, ephemeral: true});
    }

    try {
      const channel = interaction.guild.channels.cache.get(announce_channel);
      if (!channel) {
        return interaction.editReply({ content: `announce disable 2`, ephemeral: true});
      }
      announce_channel = channel;
    } catch {
      return interaction.editReply({ content: `announce disable 2`, ephemeral: true});
    }

    if (!announce_channel.id) {
      return interaction.editReply({ content: `announce disable 3`, ephemeral: true});
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
