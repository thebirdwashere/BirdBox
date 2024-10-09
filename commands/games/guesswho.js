const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, channelLink } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guesswho')
        .setDescription('Guess the original author of a randomly chosen message.'),
    async execute(interaction, {client}) {
        await interaction.deferReply()
        
        const randomMessage = await getRandomMessage(interaction, client, 0)

        //console.log(randomMessage)

        if (randomMessage.content) {
            await interaction.reply(randomMessage.content)
        } else {
            await interaction.reply("couldn't find anything")
        }
    }
}

async function getRandomChannel(interaction, client) {
    const serverChannels = await interaction.guild.channels.fetch()
    const serverTextChannels = await serverChannels
        .filter(channel => ![4, 13, 14].includes(channel.type)) //disallow non-text channels
        .filter(async channel => {
            const permissions = await channel.permissionsFor(client.user)
            return permissions.has(PermissionsBitField.Flags.ReadMessageHistory) && permissions.has(PermissionsBitField.Flags.ViewChannel)
        }) //test for reading perms
        .map(item => item) //make into array
    
    let serverThreads = []
    for (let channel in serverTextChannels) {
        let channelThreads = await channel?.threads?.fetch?.()
        channelThreads = await channelThreads?.threads?.filter?.(async thread => {
            const permissions = await thread.permissionsFor(client.user)
            return permissions.has(PermissionsBitField.Flags.ReadMessageHistory) && permissions.has(PermissionsBitField.Flags.ViewChannel)
        })?.map?.(item => item)
        if (channelThreads?.length) {
            console.log("threads", channelThreads)
            serverThreads.concat(channelThreads)
        }
    }

    serverTextChannels.concat(serverThreads)

    console.log("FINAL THREADS", serverThreads)
    
    if (serverTextChannels.length) {
        const randomChannel = serverTextChannels[Math.floor(Math.random() * serverTextChannels.length)]
        return randomChannel
    } else {
        return "could not find a channel"
    }
    
}

async function getRandomMessage(interaction, client, recursionCount) {
    if (recursionCount > 100) return "recursion limit exceeded"

    const randomChannel = await getRandomChannel(interaction, client)
    if (!randomChannel) return await interaction.reply("couldn't find any channels to search")

    console.log(randomChannel.name)

    let first, last
    await randomChannel.messages.fetch({limit:1,after:0}).then(collected => first = Number(collected.first().id))
    await randomChannel.messages.fetch({limit:1}).then(collected => last = Number(collected.first().id))

    const MIN_MESSAGE_CHARS = 70

    const randomId = Math.floor(Math.random() * (last - first + 1) + first)

    let collectedArray
    await randomChannel.messages.fetch({around:randomId,limit:100}).then(collected => {
        collectedArray = collected
            .map(msg => msg)
            .filter(msg => msg.content)                             //no empty messages
            .filter(msg => !msg.author.bot)                         //no messages from bots
            .filter(msg => msg.content.length >= MIN_MESSAGE_CHARS) //only messages that are long enough
            .filter(msg => !msg.content.includes("https://"))       //no messages with links
    })

    if (collectedArray.length) {
        const randomCollect = collectedArray[Math.floor(Math.random() * collectedArray.length)]
        return randomCollect
    } else {
        return getRandomMessage(interaction, client, recursionCount+1)
    }
}