const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guesswho')
        .setDescription('Guess the original author of a randomly chosen message.'),
    async execute(interaction) {
        let first, last
        await interaction.channel.messages.fetch({limit:1,after:0}).then(collected => first = Number(collected.first().id))
        await interaction.channel.messages.fetch({limit:1}).then(collected => last = Number(collected.first().id))

        const randomMessage = await findRandomArray(interaction, first, last, 0)

        if (randomMessage) {
            await interaction.reply(randomMessage.content)
        } else {
            await interaction.reply("couldn't find anything")
        }
    }
}

async function findRandomArray(interaction, first, last, recursionCount) {
    const MIN_MESSAGE_WORDS = 10

    if (recursionCount > 100) return null

    const randomId = Math.floor(Math.random() * (last - first + 1) + first)

    let collectedArray
    await interaction.channel.messages.fetch({around:randomId,limit:100}).then(collected => {
        collectedArray = collected
            .map(msg => msg)
            .filter(msg => msg.content)     //no empty messages
            .filter(msg => !msg.author.bot) //no messages from bots
            .filter(msg => msg.content.split(" ").length >= MIN_MESSAGE_WORDS)
    })

    if (collectedArray.length) {
        const randomCollect = collectedArray[Math.floor(Math.random() * collectedArray.length)]
        return randomCollect
    } else {
        return findRandomArray(interaction, first, last, recursionCount+1)
    }
}