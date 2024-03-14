const { ActivityType } = require('discord.js');

module.exports = {
    name: 'setstatus',
    description: "sets the status of the bot",
    hidden: true,
    execute({message}, {client, db, devs, prefix}){
        if (!devs.includes(message.author.id)) {
            //aborts because user does not have dev perms
            message.channel.tryreply("sorry, you must be a dev to use the setstatus command"); return; }

        const status = message.content.replace(`${prefix}setstatus `, '')
        db.set("status", status)

        client.user.setPresence({
            activities: [{ name: status, type: ActivityType.Custom }]
        });
        
        if (client.user.presence.activities[0].state === status) {
            message.tryreply("Status set successfully!")
        } else {
            message.tryreply("couldn't set the status, try again ig")
        }
    }
}