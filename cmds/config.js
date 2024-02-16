module.exports = {
    name: 'config',
    description: "command to configure server and client settings",
    async execute(message, args, vars){
        const EmbedBuilder = vars.EmbedBuilder;
        const prefix = vars.prefix;
        const db = vars.db;

        if (args[0] && !["user", "server"].includes(args[0])) {
            args[2] = args[1]; args[1] = args[0]; args[0] = "user";} //effectively, insert user into the original message
        
        const mode = args[0];
        const setting = args[1];
        const change = args[2];

        const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) == "enable")

        const userEmbed = new EmbedBuilder()
        .setColor('#cbe1ec')
        .setTitle('User Settings')
        .setDescription('Personalize the bot!')
        .setFooter({text: 'Made by TheBirdWasHere, with help from friends.'});
        for (let item of Object.keys(settingsText(prefix).user)) {
            userEmbed.addFields(settingsText(prefix).user[item])
        }

        const serverEmbed = new EmbedBuilder()
        .setColor('#cbe1ec')
        .setTitle('Server Settings')
        .setDescription('Personalize the bot!')
        .setFooter({text: 'Made by TheBirdWasHere, with help from friends.'});
        
        for (let item of Object.keys(settingsText(prefix).server)) {
            serverEmbed.addFields(settingsText(prefix).server[item])}

        if (mode == "server" && !vars.devs.includes(message.author.id)) {return message.channel.trysend("sorry, you must be a birdbox admin to modify server settings")};
        if (!classic) {require("../modernmode")[`config`](message, args, vars); return;} //redirect in case of modern mode

        if (!mode) {return message.channel.trysend({embeds: [userEmbed]})};

        if (mode == "user") {
            if (!setting || !change) {return message.channel.trysend({embeds: [userEmbed]})};
            if (!settingsText(prefix).user[setting]) {return message.channel.trysend({content: "invalid setting, try again"})};
            userSettings(message, args, vars, setting, change, true)
        } else if (mode == "server") {
            if (!setting || !change) {return message.channel.trysend({embeds: [serverEmbed]})};
            if (!settingsText(prefix).server[setting]) {return message.channel.trysend({content: "invalid setting, try again"})};
            serverSettings(message, args, vars, setting, change, true)
        }},
    settingsText: settingsText,
    userSettings: userSettings, //the below functions (for use in modern mode)
    serverSettings: serverSettings
}

function settingsText(prefix) { //everything here is funky because i wanted properties to work for both embed declaration here and selector declaration in modernmode, all without duplicating text too much. so, constructor functions. yay
    return {
        user: {
            notifs: new function () {this.title = `Notifications`;
            this.desc = 'Change where bot notifications show up.';
            this.name = `${prefix}config user notifs log/reply`; this.options = ["reply", "log"]; this.default = "reply";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**log:** Only log in the server channel dedicated to bot notifications. \n**reply:** Reply to the original message as well as log it.`},
            snipes: new function () {this.title = `Snipe Logging`;
            this.desc =  `Change whether deleted messages are logged by ${prefix}snipe.`;
            this.name = `${prefix}config user snipes enable/disable`; this.options = ["enable", "disable"]; this.default = "disable";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Log your deleted messages for snipes, regardless of who deleted it. \n**disable:** Do not log your deleted messages.`},
            classic: new function () {this.title = `Birdbox Classic`;
            this.desc = 'Toggle between modern and classic interfaces.';
            this.name = `${prefix}config user classic enable/disable`; this.options = ["enable", "disable"]; this.default = "disable";
            this.value = `${this.desc} \nDefaults to **${this.default}** if not set. \n\n**enable:** Use old text-based interfaces for content entry. \n**disable:** Use modern modal/button interfaces for content entry.`; }
        }, server: {
            notif_channel: new function() {this.title = `Notifications Channel`;
            this.desc = `Change the channel notification logs are sent to.`
            this.name = `${prefix}config server notif_channel (id)`; this.options = "channel"; this.default = "";
            this.value = `${this.desc} \nIf not set, logs will be disabled. \n\n**id:** The ID of the log channel being set.`; },
            announce_channel: new function() {this.title = `Announcement Channel`; 
            this.desc = `Change the channel ${prefix}announce sends to.`
            this.name = `${prefix}config server announce_channel (id)`; this.options = "channel"; this.default = "";
            this.value = `${this.desc} \nIf not set or set to an invalid ID, disables ${prefix}announce. \n\n**id:** The ID of the announcement channel being set.`; }
    }}
}

function userSettings(message, args, vars, setting, change, respond) {
    return new Promise((res, rej) => {
        const settings = {} //futureproofing
        async function defaultUser(message, args, vars, setting, change) {
            const db = vars.db
            if (!settingsText(vars.prefix).user[setting].options.includes(change)) {return message.channel.trysend(`not sure what ${change} means but it sure isnt "${settingsText(vars.prefix).user[setting].options.join("\" or \"")}"`)}
            
            await db.set(`setting_${setting}_${message.author.id}`, change)
            if (await db.get(`setting_${setting}_${message.author.id}`) === change) {
                if (respond) {message.channel.trysend(`Setting updated successfully!`);} res(true)}
            else {message.channel.trysend(`setting failed to update, try again`); rej(false)};
        }

        if (settings[setting]) {settings[setting](message, args, vars, setting, change)}
        else {defaultUser(message, args, vars, setting, change)}
    })
}

function serverSettings(message, args, vars, setting, change, respond) {
    return new Promise((res, rej) => {
        const settings = {
            notif_channel: async (message, args, vars, setting, change) => {
            const db = vars.db
            if (!Number(change)) {
                await db.set(`setting_notif_channel_${message.guildId}`, false); 
                return message.channel.trysend(`invalid id, notification logging disabled`)};
            await message.guild.channels.fetch(change).catch(async error => {
                await db.set(`setting_notif_channel_${message.guildId}`, false); 
                return message.channel.trysend(`id not found, notification logging disabled`);
            })

            await db.set(`setting_notif_channel_${message.guildId}`, change);
            await message.channel.trysend(`Notification channel set successfully!`);
        }, announce_channel: async (message, args, vars, setting, change) => {
            const db = vars.db
            if (!Number(change)) {
                await db.set(`setting_announce_channel_${message.guildId}`, false); 
                return message.channel.trysend(`invalid id, announcements disabled`)};
            await message.guild.channels.fetch(change).catch(async error => {
                await db.set(`setting_announce_channel_${message.guildId}`, false); 
                return message.channel.trysend(`id not found, announcements disabled`);
            })

            await db.set(`setting_announce_channel_${message.guildId}`, change);
            await message.channel.trysend(`Announcement channel set successfully!`);
        }}
        async function defaultServer(message, args, vars, setting, change) {
            //futureproofing a default server setting (currently unused)
            const db = vars.db
            if (!settingsText(vars.prefix).server[setting].options.includes(change)) {return message.channel.trysend(`not sure what ${change} means but it sure isnt "${settingsText(vars.prefix).server[setting].options.join('" or "')}"`)}
            
            await db.set(`setting_${setting}_${message.guildId}`, change)
            if (await db.get(`setting_${setting}_${message.guildId}`) === change) {
                if (respond) {message.channel.trysend(`Setting updated successfully!`);} res(true)}
            else {message.channel.trysend(`setting failed to update, try again`); rej(false); return;};
        }

        if (settings[setting]) {settings[setting](message, args, vars, setting, change)}
        else {defaultServer(message, args, vars, setting, change)}

        res(true)
    })
}