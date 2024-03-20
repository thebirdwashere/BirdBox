module.exports = {
    name: 'announce',
    description: "Announce to another channel. May be disabled depending on server.",
    async execute({message}, {db, prefix}){
        let announce_channel = await db.get(`settings.announce_channel.${message.guildId}`)
        
        try {await message.guild.channels.fetch(announce_channel)
            .then(channel => announce_channel = channel)
        } catch {message.channel.trysend(`announcements disabled currently, use ${prefix}config to enable it`); return;}
        
        if (!announce_channel.id) {message.channel.trysend(`announcements disabled currently, use ${prefix}config to enable it`); return;}
        
        announce_channel.trysend(message.content.replace(`${prefix}announce`, '').trim());
    }
}