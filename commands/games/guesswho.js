const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ComponentType } = require("discord.js");
const { getSettingValue } = require("../../utils/scripts/util_scripts.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guesswho')
        .setDescription('Guess the original author of a randomly chosen message.'),
    async execute(interaction, {client, embedColors, db}) {
        //await interaction.deferReply()
        
        const randomMessage = await getRandomMessage(interaction, client, db, 0)

        console.log(randomMessage)

        const messageEmbed = new EmbedBuilder()
            .setAuthor({ name: `???????????`, iconURL: "https://cdn.discordapp.com/embed/avatars/0.png" })
            .setColor(embedColors.blue)
            .setDescription(randomMessage.content)
            .setFooter({ text: "Guess who sent this!" });
        
        const lifelinesButton = new ButtonBuilder()
            .setCustomId("guesswho-lifelines")
            .setLabel("Lifelines")
            .setStyle(ButtonStyle.Primary);
        
        const buttonRow = new ActionRowBuilder()
            .addComponents(lifelinesButton)

        const response = await interaction.reply({embeds: [messageEmbed], components: [buttonRow]})

        const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

        buttonCollector.on('collect', async i => {
            switch (i.customId) {
                case "guesswho-lifelines": {

                    const lifelines = [
                        {emoji: "⏰", id: "guesswho-stopwatch", name: "⏰ Stopwatch", value: `Displays the original send date`, inline: true},
                        {emoji: "🔛", id: "guesswho-banda", name: "🔛 Before & After", value: `Adds two messages of context from the same person`, inline: true}
                    ]

                    const lifelinesEmbed = new EmbedBuilder()
                        .setTitle("Lifelines")
                        .setColor(embedColors.blue)
                        .addFields(lifelines)
                    
                    const lifelinesRows = [new ActionRowBuilder()/*, new ActionRowBuilder()*/]
                    
                    for (let i = 0; i < lifelines.length; i++) {
                        const button = new ButtonBuilder()
                            .setEmoji(lifelines[i].emoji)
                            .setStyle(ButtonStyle.Success)
                            .setCustomId(lifelines[i].id)
                        
                        lifelinesRows[Math.floor(i/3)].addComponents(button)
                    }
                    
                    const lifelinesMessage = await i.channel.send({embeds: [lifelinesEmbed], components: lifelinesRows})

                    const lifelinesCollector = lifelinesMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });
            
                    lifelinesCollector.on('collect', async buttoni => {
                        switch (buttoni.customId) {
                            case "guesswho-stopwatch": {
                                messageEmbed.setTimestamp(randomMessage.createdTimestamp)
                                await response.edit({embeds: [messageEmbed]})
                                
                                break;
                            }
                            case "guesswho-banda": {
                                //TODO
                                await response.edit({embeds: [messageEmbed]})
                                break;
                            }

                        }
                    });

                    lifelinesCollector.on("end", async () => {
                        //disable the buttons
                        lifelinesRows.forEach(item => item.components.forEach(item => item.setDisabled(true)))
                        await response.edit({ components: [buttonRow] })
                    });

                    break;
                }
            }

            await response.edit({embeds: [messageEmbed], components: [buttonRow]})
        })
    
        buttonCollector.on("end", async () => {
            //disable the buttons
            buttonRow.components.forEach(item => item.setDisabled(true))
            await response.edit({ components: [buttonRow] })
        });
    }
}

async function getRandomThread(client, channel) {
    let channelThreads = await channel?.threads?.fetch?.()

    channelThreads = await channelThreads?.threads?.filter?.(async thread => {
        const permissions = await thread.permissionsFor(client.user)
        return permissions.has(PermissionsBitField.Flags.ReadMessageHistory) && permissions.has(PermissionsBitField.Flags.ViewChannel)
    })?.map?.(item => item)

    //need to decide if we search a thread or the main channel
    const numberOfThreads = channelThreads.length
    const channelDecision = Math.floor(Math.random() * (numberOfThreads+1))

    if (channelDecision === numberOfThreads && channel.isTextBased()) {
        //search this channel
        return channel;
    } else {
        const threadMessageCounts = channelThreads.map(item => item?.messageCount)
        
        if (channelThreads.length) {
            //https://stackoverflow.com/questions/43566019/how-to-choose-a-weighted-random-array-element-in-javascript
            let i;
    
            for (i = 1; i < threadMessageCounts.length; i++)
            threadMessageCounts[i] += threadMessageCounts[i - 1];
    
            const randomDecision = Math.random() * threadMessageCounts[threadMessageCounts.length - 1];
    
            for (i = 0; i < threadMessageCounts.length; i++)
                if (threadMessageCounts[i] > randomDecision)
                    break;
            
            return channelThreads[i]
        } else {
            return "could not find a thread"
        }
    }
}

// async function getRandomChannel(interaction, client) {
//     const serverChannels = await interaction.guild.channels.fetch()
//     const serverTextChannels = await serverChannels
//         .filter(channel => ![4, 13, 14].includes(channel.type)) //disallow non-text channels
//         .filter(async channel => {
//             const permissions = await channel.permissionsFor(client.user)
//             return permissions.has(PermissionsBitField.Flags.ReadMessageHistory) && permissions.has(PermissionsBitField.Flags.ViewChannel)
//         }) //test for reading perms
//         .map(item => item) //make into array
    
//     if (serverTextChannels.length) {
//         const randomChannel = serverTextChannels[Math.floor(Math.random() * serverTextChannels.length)]
//         return randomChannel
//     } else {
//         return "could not find a channel"
//     }
    
// }

async function getRandomMessage(interaction, client, db, recursionCount) {
    if (recursionCount > 100) return "recursion limit exceeded"

    const searchedChannelId = await getSettingValue(`settings.guesswho_channel.${interaction.guildId}`, db) ?? interaction.channelId
    const searchedChannel = interaction.guild.channels.cache.get(searchedChannelId);

    if (!searchedChannel) {
        return await interaction.reply("failed to locate channel")
    }
 
    const randomChannel = await getRandomThread(client, searchedChannel)
    if (!randomChannel) return await interaction.reply("couldn't find any channels to search")

    console.log(randomChannel.name)

    let first, last
    await randomChannel.messages.fetch({limit:1,after:0}).then(collected => first = Number(collected.first().id))
    await randomChannel.messages.fetch({limit:1}).then(collected => last = Number(collected.first().id))

    const MIN_MESSAGE_CHARS = 50

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

    console.log(collectedArray)

    if (collectedArray.length) {
        const randomCollect = collectedArray[Math.floor(Math.random() * collectedArray.length)]
        return randomCollect
    } else {
        return getRandomMessage(interaction, client, db, recursionCount+1)
    }
}