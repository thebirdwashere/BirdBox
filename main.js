// BirdBox Unified
// Developed by TheBirdWasHere (with help from others as well)

const devArray = require("./cmds/json_info/dev_array.json");

const devs = devArray.host.map(item => item.userId).concat(devArray.developer.map(item => item.userId));

const Discord = require('discord.js');

require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, AuditLogEvent, Events } = require('discord.js');
const client = new Client({intents : [GatewayIntentBits.GuildMessages , GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]});

const fs = require('fs');

client.commands = new Discord.Collection();
client.snipes = new Discord.Collection();

const commandFiles = fs.readdirSync('./cmds/').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
    const command = require(`./cmds/${file}`)
    client.commands.set(command.name, command)
}

const { QuickDB } = require("quick.db");
const db = new QuickDB();

const tests = require("./messagetests")
const modals = require("./modals");
const { randomIntInRange, randomChoice } = require("./utils");

let IS_CANARY = true
let prefix;
let vars = {
    db: db,
    devs: devs,
    devArray: devArray,
    client: client,
    Discord: Discord
};

//new send functions to not crash when missing permissions
Discord.BaseChannel.prototype.trysend = async function(content) {
    try { return await this.send(content); } catch {
        console.warn(`Error sending message in ${this.guild.name}'s ${this.name}; check if permissions are needed for that channel`);}}

Discord.Message.prototype.tryreply = async function(content) {
    try { return await this.reply(content); } catch {
        console.warn(`Error sending message in ${this.guild.name}'s ${this.channel.name}; check if permissions are needed for that channel`);}}

client.once('ready', async () => {
    console.log('BirdBox Unified is now online! (developed by TheBirdWasHere and friends)');
    console.log('Logs will be shown in this terminal, better hope this stuff works and doesnt break');
    console.log(`Logged in as ${client.user.tag}!`);

    if (client.user.id == 803811104953466880) { //main
        prefix = 'e;';
        IS_CANARY = false;}
    else if (client.user.id == 911696357356617759) { //main canary
        prefix = 'ec;';}
    else { //other; probably a testing bot created by somebody
        prefix = 'ek;';}
    
    vars.prefix = prefix
    
    let status = await db.get("status")
    if (!status) {
        status = `ah, the sweet smell of a fresh birdbox build - ${prefix}help`}

    client.user.setPresence({
        activities: [{ name: status, type: ActivityType.Custom }]
    });
});

client.on('messageDelete', async (message) => {
    const userAllowsSnipes = (await db.get(`setting_snipes_${message.author.id}`) === "enable");         //equals enable since default is off
    const serverAllowsSnipes = (await db.get(`setting_snipes_server_${message.guildId}`) !== "disable"); //does not equal disable since default is on

    if (!userAllowsSnipes || !serverAllowsSnipes) return; //don't log people who opted out
    if (!message.author || !message.createdAt) return;    //don't store busted snipes (edit: not even sure if this does anything lol)
	await db.set(`snipes.${message.channelId}`, {
		content: message?.content,
		author: {tag: message.author.tag, id: message.author.id},
        timestamp: message.createdAt,
        attachment: message.attachments.first()?.url // Grabs the first attachment url out of the message, EXPERIMENTAL FEATURE
	});
})

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) {return;}
    modals.modalHandler(interaction, vars); //handle modals for birdbox modern version
});

//ANY BIRDBOX MESSAGE TESTS (CANARY OR MAIN)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; //birdbox or other bot check
    if (!message.content) return;   //no reason to check an empty message

    const content = message.content.toLowerCase() //replaced several uses of message.content with this (however changed so the prefix and command must be lowercase)

    if (message.content.startsWith(prefix)) { //command checker
        const args = message.content.slice(prefix.length).trim().split(/ +/g);

        const command = args.shift().toLowerCase();
        if (client.commands.has(command)) {
            client.commands.get(command).execute({message, args}, vars);}}

    //sticker/lyric responses
    const messageArray = await db.get("messages") //used for message responses
    const lyricArray = await db.get("lyrics")     //used for lyric responses

    const repliesAllowed = (await db.get(`setting_responses_${message.guildId}`) !== "disable")
    const keywordTestResult = await tests.keywords(db, content, message.guildId, messageArray, lyricArray)
    if (repliesAllowed && keywordTestResult) {
        message.tryreply(keywordTestResult);}

    //ping responses
    if (message.content.includes(`<@${client.user.id}>`)) {
        const pingReplies = [
            "bruh can't a bot get some shuteye around here",
            "make it quick alright",
            "you rang?",
            "i've been summoned",
            "whomst has awakened the ancient one",
            "what's up",
            "hello there",
            "that's my name, don't wear it out"
        ]

        message.tryreply(randomChoice(pingReplies))
    }

});

//MAIN BIRDBOX ONLY MESSAGE TESTS (NO CANARY)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; //birdbox or other bot check
    if (!message.content) return;   //no reason to check an empty message
    if (IS_CANARY) return;          //canary not allowed here

    //randomly interrupt conversation for fun
    const randomInterruptionInt = randomIntInRange(1, 5000)
    if (randomInterruptionInt == 5000) {
        const interruptions = [
            "https://media.discordapp.net/attachments/1138589419796955270/1218588520247988294/saved.gif",

            //https://www.tumblr.com/arcaneloquence/140358623151/things-you-can-say-in-response-to-literally
            "As the prophecy foretold.",
            "But at what cost?",
            "So let it be written; so let it be done.",
            "So...it has come to this.",
            "That's just what he/she/they would've said.",
            "Is this why fate brought us together?",
            "And thus, I die.",
            "...just like in my dream...",
            "Be that as it may, still may it be as it may be",
            "There is no escape from destiny.",
            "Wise words by wise men write wise deeds in wise pen.",
            "In this economy?",
            "....and then the wolves came."
        ]

        message.channel.trysend(randomChoice(interruptions))
    }

    //create notif channel for message tests
    let notifchannel = false //by default, do not log
    await message.guild.channels.fetch(await db.get(`setting_notif_channel_${message.guildId}`)).then(channel => {
        if (!(channel instanceof Discord.Collection)) {notifchannel = channel}}) //for logged responses, overwrites default if found

    const alphabeticalness = tests.alphabetical(content)
    if (alphabeticalness) { //alphabetical order checker
        const randomWord = randomChoice(alphabeticalness)
        const randomfooters = [
            `now i know my abc's, next time won't you sing with me`,
            `perfectly sorted, as all things should be`,
            `remember kids, ${randomWord[0].toUpperCase()} is for "${randomWord}"`]
        
        let isItTechnical
        if (alphabeticalness.every( (val, i, arr) => val === arr[0] )) { //this test if every item is the same
            isItTechnical = "technical"
        } else {
            isItTechnical = "perfect"
        }
        const alpha_joined = alphabeticalness.join(" ");
        
        const notif = await tests.responsetemplate(message, db, randomfooters, 
            `:capital_abcd: Your message is in ${isItTechnical} alphabetical order! \n\`${alpha_joined}\``, 
            `:capital_abcd:`, `is in ${isItTechnical} alphabetical order!`, 
            0x3b88c3, alpha_joined)
        if (notifchannel) {await notifchannel.trysend(notif)} //only send notif if there is a log channel
    }

    const jinxDetectionEnabled = (await db.get(`setting_jinxes_${message.guildId}`) !== "disable")

    if (jinxDetectionEnabled) {
        const jinx = await db.get(`jinxes.${message.channelId}`) //jinx detector
        if (tests.jinx(message, jinx)) { message.channel.trysend(jinx.content) }
    }

    const periodicness = tests.periodictable(content)
    if (periodicness) { //periodic table checker
        const randomfooters = [
            `${message.author.username} nye the science guy fr`,
            `i wonder if this is a real compound, probably not but still`,
            `one could say, this only happens... periodically`]
        
            const notif = await tests.responsetemplate(message, db, randomfooters, 
            `:test_tube: Your message is on the periodic table! \n\`${periodicness}\``, 
            `:test_tube:`, `is on the periodic table!`, 
            0x21c369, periodicness)
            if (notifchannel) {await notifchannel.trysend(notif)} //only send notif if there is a log channel
    }

    if (jinxDetectionEnabled) {
        const oldJinxFormat = await db.get(`jinx_${message.channelId}`)
        if (oldJinxFormat) {
            await db.delete(`jinx_${message.channelId}`) //remove jinxes in the old format to clean up the db
        }

        //new format: changed to use dot notation and make an object of jinxes
        await db.set(`jinxes.${message.channelId}`, { 
            content: message.content, //for jinx detection
            author: message.author.id,
            timestamp: message.createdTimestamp
        })
    };
});

client.login(process.env.DISCORD_TOKEN);
