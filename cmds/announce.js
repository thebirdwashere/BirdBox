const { EmbedBuilder } = require("discord.js")

module.exports = {
    name: 'announce',
    description: "Announce to another channel. May be disabled depending on server.",
    async execute({message}, {db, prefix}){
        let announce_channel = await db.get(`setting_announce_channel_${message.guildId}`)
        
        try {await message.guild.channels.fetch(announce_channel)
            .then(channel => announce_channel = channel)
        } catch {message.channel.trysend(`announcements disabled currently, use ${prefix}config to enable it`); return;}
        
        if (!announce_channel.id) {message.channel.trysend(`announcements disabled currently, use ${prefix}config to enable it`); return;}
        
        const announcedEmbed = new EmbedBuilder()
        .setTitle(`${message.channel.name}’s Announcement`)
        .setDescription(message.content.replace(`${prefix}announce`, '').trim())
        .setAuthor({name: message.author.tag, iconURL: message.author.displayAvatarURL()})
        .setColor(0xAA00FF)
        .setTimestamp(message.createdTimestamp);

        announce_channel.trysend({embeds: [announcedEmbed]});
    }
}