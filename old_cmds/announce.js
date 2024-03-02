module.exports = {
    name: 'announce',
    description: "announce something to a designated channel",
    async execute({message}, {db, prefix}){
        let announce_channel = await db.get(`setting_announce_channel_${message.guildId}`)
        
        try {await message.guild.channels.fetch(announce_channel)
            .then(channel => announce_channel = channel)
        } catch {message.channel.trysend(`announcements disabled currently, use ${prefix}config to enable it`); return;}
        
        if (!announce_channel.id) {message.channel.trysend(`announcements disabled currently, use ${prefix}config to enable it`); return;}
        
        announce_channel.trysend(message.content.replace(`${prefix}announce`, '').trim());
    }
}