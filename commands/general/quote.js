const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { randomFooter } = require("../../utils/scripts/util_scripts.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('quote')
		.setDescription('Birdbox will replicate a message in its original form.')
        .addStringOption(option =>
			option
				.setName('message')
				.setDescription('The message link being quoted.')
				.setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('end')
                .setDescription('Another message by the same person. Used to quote a continuous chain of messages.')
        ),
    async execute(interaction, {embedColors}) {
        const [targetChannelId, targetMessageId] = interaction.options.getString('message').replace(`https://discord.com/channels/${interaction.guildId}/`, "").split("/");
        let targetChannel, targetMessage, endChannel, endMessage

        try {
            targetChannel = await interaction.guild.channels.fetch(targetChannelId)
            targetMessage = await targetChannel.messages.fetch(targetMessageId)
        } catch {
            return interaction.reply({ content: "couldn't find that message. are you sure it's in this server?", ephemeral: true });
        }
        
        if (interaction.options.getString('end')) {
            const [endChannelId, endMessageId] =  interaction.options.getString('end').replace(`https://discord.com/channels/${interaction.guildId}/`, "").split("/");
    
            try {
                endChannel = await interaction.guild.channels.fetch(endChannelId)
                endMessage = await endChannel.messages.fetch(endMessageId)
            } catch {
                return interaction.reply({ content: "couldn't find the end message. are you sure it's in this server?", ephemeral: true });
            }
        }

        if (endMessage && (targetChannel?.id !== endChannel?.id)) return interaction.reply({ content: "those messages arent even in the same channel lol, i cant quote that", ephemeral: true });

        if (!endMessage) return interaction.reply({ embeds: [replicateMessage(targetMessage, embedColors)]})
        
        const recentMessagesList = await interaction.channel.messages.fetch({ before: endMessage.id, limit: 50 }) //max allowed limit

        if (recentMessagesList.find(msg => msg === targetMessage)) {
            let recentMessagesArray = recentMessagesList.map(item => item)

            recentMessagesArray.reverse()

            const targetIndex = recentMessagesArray.indexOf(targetMessage)

            recentMessagesArray.splice(0, targetIndex)
            recentMessagesArray.push(endMessage)

            const recentMessagesString = recentMessagesArray.map(msg => msg.content).join("\n")
            const recentMessagesAttachments = recentMessagesArray.map(msg => msg.attachments).reduce((a, b) => a.concat(b)).map(item => item);

            if (recentMessagesString.length > 4096) {
                return await interaction.reply({ content: "sorry, that's too many characters to fit into a single quote; try splitting it up a bit", ephemeral: true });
            }

            let replicationMessage = targetMessage
            replicationMessage.content = recentMessagesString
            replicationMessage.attachments = recentMessagesAttachments

            const replicatedEmbed = replicateMessage(replicationMessage, embedColors)
            return await interaction.reply({embeds: [replicatedEmbed]})

        } else {
            return await interaction.reply({ content: "couldn't find all the messages being quoted, make sure there aren't too many", ephemeral: true });
        }
    },
    async executeClassic({message, args}, {embedColors}) {
        const [targetChannelId, targetMessageId] = args[0] ? args[0].replace(`https://discord.com/channels/${message.guildId}/`, "").split("/") : [0, 0];
        let targetChannel, targetMessage, endChannel, endMessage

        try {
            targetChannel = await message.guild.channels.fetch(targetChannelId)
            targetMessage = await targetChannel.messages.fetch(targetMessageId)
        } catch {
            return message.reply("couldn't find that message. are you sure it's in this server?");
        }
        
        if (args[1]) {
            const [endChannelId, endMessageId] = args[1] ? args[1].replace(`https://discord.com/channels/${message.guildId}/`, "").split("/") : [0, 0];
    
            try {
                endChannel = await message.guild.channels.fetch(endChannelId)
                endMessage = await endChannel.messages.fetch(endMessageId)
            } catch {
                return message.reply("couldn't find the end message. are you sure it's in this server?");
            }
        }

        if (endMessage && (targetChannel?.id !== endChannel?.id)) return message.reply("those messages arent even in the same channel lol, i cant quote that");

        if (!endMessage) return message.reply({ embeds: [replicateMessage(targetMessage, embedColors)]})
        
        const recentMessagesList = await message.channel.messages.fetch({ before: endMessage.id, limit: 50 }) //max allowed limit

        if (recentMessagesList.find(msg => msg === targetMessage)) {
            let recentMessagesArray = recentMessagesList.map(item => item)

            recentMessagesArray.reverse()

            const targetIndex = recentMessagesArray.indexOf(targetMessage)

            recentMessagesArray.splice(0, targetIndex)
            recentMessagesArray.push(endMessage)

            const recentMessagesString = recentMessagesArray.map(msg => msg.content).join("\n")
            const recentMessagesAttachments = recentMessagesArray.map(msg => msg.attachments).reduce((a, b) => a.concat(b)).map(item => item);

            if (recentMessagesString.length > 4096) {
                return await message.reply("sorry, that's too many characters to fit into a single quote; try splitting it up a bit");
            }

            let replicationMessage = targetMessage
            replicationMessage.content = recentMessagesString
            replicationMessage.attachments = recentMessagesAttachments

            const replicatedEmbed = replicateMessage(replicationMessage, embedColors)
            return await message.reply({embeds: [replicatedEmbed]})

        } else {
            return await message.reply("couldn't find all the messages being quoted, make sure there aren't too many");
        }
    }
}

function replicateMessage(message, embedColors) {
    const embed = new EmbedBuilder()
        .setAuthor({ name: `Message from ${message.author.displayName}`, url: message.url, iconURL: message.author.avatarURL() })
        .setDescription(message.content)
        .setColor(embedColors.blue)
        .setTimestamp(message.createdTimestamp)
        .setFooter({ text: randomFooter("quote") })

    if (message.attachments.length) {
        const imageAttachment = message.attachments.filter(attachment => attachment.contentType.startsWith("image"))[0]
        embed.setImage(imageAttachment?.url)

        if (!imageAttachment || (imageAttachment && message.attachments.length > 1)) {
            embed.addFields({ name: "Not displayed", value: `\`[${imageAttachment ? message.attachments.length - 1 : message.attachments.length} attachment(s)]\`` })
        }
    }

    return embed
}
