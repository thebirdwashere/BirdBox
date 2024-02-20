const { ActivityType } = require('discord.js');

module.exports = {
    name: 'setstatus',
    description: "sets the status of the bot",
    execute(message, args, vars){
        if (!vars.devs.includes(message.author.id)) {
            //aborts because user does not have dev perms
            message.channel.trysend("sorry, you must be a dev to use the setstatus command"); return; }
        
        const client = vars.client;
        const db = vars.db;

        const status = message.content.replace(`${vars.prefix}setstatus`, '')
        db.set("status", status)

        client.user.setPresence({
            activities: [{ name: status, type: ActivityType.Custom }]
        });
    }
}