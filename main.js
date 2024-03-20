// BirdBox Unified
// Developed by TheBirdWasHere (with help from others as well)

const devArray = require("./cmds/json_info/dev_array.json");

const devs = devArray.host.map(item => item.userId).concat(devArray.developer.map(item => item.userId));

const Discord = require('discord.js');

require('dotenv').config();
const { Client, GatewayIntentBits , Message, MessageEmbed, DiscordAPIError, ActivityType, EmbedBuilder } = require('discord.js');
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
const { randomIntInRange } = require("./utils");

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
    
    //check database version (we might need other versions in the future)
    let dbVersionNum = await db.get("db_version") || 1
    switch (dbVersionNum) {
        case 1:
            dbVersionNum++

            const oldFormatJinxes = await db.startsWith("jinx_")
            oldFormatJinxes.forEach(async jinx => await db.delete(jinx.id))

            const oldFormatExpectedLyrics = await db.startsWith("lyric_")
            oldFormatExpectedLyrics.forEach(async lyric => await db.delete(lyric.id))
        
            const oldFormatSnipes = await db.startsWith("snipe_")
            oldFormatSnipes.forEach(async snipe => {
                await db.delete(snipe.id)
                //move old snipes to new format
                const snipeId = snipe.id.replace("snipe_", "")
                await db.set(`snipes.${snipeId}`, snipe.value)
            })

            const oldFormatSettings = await db.startsWith("setting_")
            const newFormatSettings = {};
            oldFormatSettings.forEach(async setting => {
                const settingText = setting.id.replace("setting_", "")

                const settingParts = settingText.split(/(\d+)/)       //splits at first instance of a number
                const settingName = settingParts.shift().slice(0, -1) //takes first element (the actual setting) out
                const settingId = settingParts[0]                     //grabs the number

                if (!newFormatSettings[settingName]) newFormatSettings[settingName] = {}
                newFormatSettings[settingName][settingId] = setting.value

                await db.delete(setting.id)
            })          
            
            await db.set(`settings`, newFormatSettings)

        case NaN: //unlikely to actually register, used as an overflow from previous cases
            console.log("");
            console.log(`Database version detected as out of date, moved to version ${dbVersionNum}`);
            console.log("");

            await db.set("db_version", dbVersionNum)

            break; //break statements not used elsewhere so you go instantly to the latest version
    }
});

client.on('messageDelete', async (message) => {
    const userAllowsSnipes = (await db.get(`settings.snipes.${message.author.id}`) === "enable");         //equals enable since default is off
    const serverAllowsSnipes = (await db.get(`settings.snipes_server.${message.guildId}`) !== "disable"); //does not equal disable since default is on

    if (!userAllowsSnipes || !serverAllowsSnipes) {return;}; //don't log people who opted out
    if (!message.author || !message.createdAt) {return;};    //don't store busted snipes (edit: not even sure if this does anything lol)
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

client.on('messageCreate', async (message) => {
    if (message.author.id == client.user.id) {return;} //birdbox check
    if (!message.content) {return;}                    //no reason to check an empty message

    const content = message.content.toLowerCase() //replaced several uses of message.content with this (however changed so the prefix and command must be lowercase)

    const willWeSendFoof = randomIntInRange(1, 1000)
    if (willWeSendFoof == 1000) {
        message.channel.trysend("https://media.discordapp.net/attachments/1138589419796955270/1218588520247988294/saved.gif")
    }

    if (message.content.startsWith(prefix)) { //command checker
        const args = message.content.slice(prefix.length).trim().split(/ +/g);

        const command = args.shift().toLowerCase();
        if (client.commands.has(command)) {
            client.commands.get(command).execute({message, args}, vars);}}

    //sticker/lyric responses
    const messageArray = await db.get("messages") //used for message responses
    const lyricArray = await db.get("lyrics")     //used for lyric responses

    const repliesAllowed = (await db.get(`settings.responses.${message.guildId}`) !== "disable")
    const keywordTestResult = await tests.keywords(db, content, message.guildId, messageArray, lyricArray)
    if (repliesAllowed && keywordTestResult) {
        message.tryreply(keywordTestResult);}

    if (IS_CANARY) {return;} //make sure none of this is duplicated on canary

    //run tests and stuff
    tests.detection({message, content}, {db, Discord}, tests);
});

client.login(process.env.DISCORD_TOKEN);
