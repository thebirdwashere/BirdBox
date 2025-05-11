const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js");
const { getSettingValue } = require("../../utils/scripts/util_scripts")

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
  async execute(interaction, {db}) {
    let announce_channel = await interaction.options?.getChannel("channel")?.id ?? await getSettingValue(`settings.announce_channel.${interaction.guildId}`, db) ?? interaction.channelId;

    if (!announce_channel) {
      return await interaction.reply({ content: `something went very wrong and i couldn't find a channel to announce to`, ephemeral: true});
    }

    try {
      const channel = await interaction.guild.channels.cache.get(announce_channel);
      if (!channel) {
        return await interaction.reply({ content: `announcement channel could not be found (somehow), try a different one`, ephemeral: true});
      }
      announce_channel = channel;
    } catch {
      return await interaction.reply({ content: `announcement channel could not be found, try a different one`, ephemeral: true});
    }

    const announceEmbed = new EmbedBuilder()
     .setTitle(`${interaction.channel.name}'s Announcement`)
     .setDescription(interaction.options.getString("message").trim())
     .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
     .setColor(0xAA00FF)
     .setTimestamp(interaction.createdTimestamp);

    announce_channel.send({ embeds: [announceEmbed] }).then(() => {
      interaction.reply({ content: "Announcement sent!", ephemeral: true });
    }).catch(() => {
      interaction.reply({ content: `error sending announcement, make sure i can speak in your chosen channel`, ephemeral: true });
    });
  },
  async executeClassic({message, args, strings}, {db}) {
    if (!strings[0]) return await message.reply('you need to enter an announcement surrounded by quotes')

    let announce_channel = args[0]?.replace(`https://discord.com/channels/${message.guildId}/`, "") ?? await getSettingValue(`settings.announce_channel.${message.guildId}`, db) ?? message.channelId;

    if (!announce_channel) {
      return await message.reply({ content: `something went very wrong and i couldn't find a channel to announce to`, ephemeral: true});
    }

    try {
      const channel = await message.guild.channels.cache.get(announce_channel);
      if (!channel) {
        return await message.reply({ content: `announcement channel could not be found, try a different one`, ephemeral: true});
      }
      announce_channel = channel;
    } catch {
      return await message.reply({ content: `announcement channel could not be found (somehow), try a different one`, ephemeral: true});
    }

    const announceEmbed = new EmbedBuilder()
     .setTitle(`${message.channel.name}'s Announcement`)
     .setDescription(strings[0].trim())
     .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
     .setColor(0xAA00FF)
     .setTimestamp(message.createdTimestamp);

    announce_channel.send({ embeds: [announceEmbed] }).then(() => {
      message.reply({ content: "Announcement sent!", ephemeral: true });
    }).catch(() => {
      message.reply({ content: `error sending announcement, make sure i can speak in your chosen channel`, ephemeral: true });
    });
  }
}
