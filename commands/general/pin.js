const { SlashCommandBuilder } = require("discord.js");
const { getSettingValue } = require("../../utils/scripts/util_scripts")

module.exports = {
    data: new SlashCommandBuilder()
		.setName('pin')
		.setDescription('Pin/unpin a message by link. May be disabled depending on config.')
        .addStringOption(option =>
			option
				.setName('message')
				.setDescription('The message link to pin.')
				.setRequired(true)
        ),
    async execute(interaction, {db, admins}) {

        const [targetChannelId, targetMessageId] = interaction.options.getString('message').replace(`https://discord.com/channels/${interaction.guildId}/`, "").split("/");
        let targetChannel, targetMessage

        try {
            targetChannel = await interaction.guild.channels.fetch(targetChannelId)
            targetMessage = await targetChannel.messages.fetch(targetMessageId)
        } catch {
            return interaction.reply({ content: "couldn't find that message. are you sure it's in this server?", ephemeral: true });
        }
        
        const channelOwner = targetMessage.channel.ownerId
        const interactionUser = interaction.member.id
        const userIsAdmin = admins.map(user => user.userId).includes(interactionUser) //admins get bypass on any check

        const pinSetting = await getSettingValue(`settings.pinning.${interaction.guildId}`, db)
        const anyoneCanPin = pinSetting == "everyone"
        const nobodyCanPin = pinSetting == "nobody"

        if (nobodyCanPin) return interaction.reply({ content: "sorry, the admins disabled pin functions in this server", ephemeral: true });
        
        if (!targetMessage.pinned) {

            //if it's a thread
            if (!anyoneCanPin && !userIsAdmin && channelOwner && channelOwner !== interactionUser)
                { return interaction.reply({ content: "sorry, you can only pin messages in a thread you own", ephemeral: true }); }

            try { 
                await targetMessage.pin()
            } catch (err) { console.error(err) }

            await interaction.reply({ content: 'pinning...', ephemeral: true });
            await interaction.deleteReply(); //had to use bailey's code and yep it's janky

        } else { //if it's already pinned

            //if it's a thread
            if (!anyoneCanPin && !userIsAdmin && channelOwner && channelOwner !== interactionUser) {
                return interaction.reply({ content: "sorry, you can only unpin messages in a thread you own", ephemeral: true }); }
            //if it's not a thread
            if (!anyoneCanPin && !userIsAdmin && !channelOwner) { 
                return interaction.reply({ content: "sorry, you can't unpin messages here", ephemeral: true }); }

            try {
                await targetMessage.unpin()
                if (targetMessage.content) {
                    const targetMessageContent = targetMessage.content.replace("\n", " ")
                    const maxMessageLength = 50
                    await interaction.reply(`\`${(targetMessageContent.length > maxMessageLength ? `${targetMessageContent.substring(0, maxMessageLength)}...` : targetMessageContent)}\` unpinned successfully!`).catch(e => console.error(e));
                } else {
                    await interaction.reply(`Unpinned successfully!`);
                }
                
            } catch (err) { console.error(err) }
        }
    },
    async executeClassic({message, args}, {admins}) {

        const [targetChannelId, targetMessageId] = args[0] ? args[0].replace(`https://discord.com/channels/${message.guildId}/`, "").split("/") : [0, 0];

        let targetChannel, targetMessage

        try {
            targetMessage = await message.fetchReference();
        } catch (err) {
            try {
                targetChannel = await message.guild.channels.fetch(targetChannelId)
                targetMessage = await message.channel.messages.fetch(targetMessageId)
            } catch (err) {
                return message.reply("try again, either reply to the message you want pinned or give me its link");
            }
        }
        
        const channelOwner = targetMessage.channel.ownerId
        const pinningUser = message.author.id
        const userIsAdmin = admins.map(user => user.userId).includes(pinningUser) //admins get bypass on any check
        
        if (!targetMessage.pinned) {

            //if it's a thread
            if (!userIsAdmin && channelOwner && channelOwner !== pinningUser) 
                { return message.reply("sorry, you can only pin messages in a thread you own").catch(e => console.error(e)); }

            try { 
                await targetMessage.pin()
            } catch (err) { console.error(err) }

        } else { //if it's already pinned

            //if it's a thread
            if (!userIsAdmin && channelOwner && channelOwner !== pinningUser) {
                return message.reply("sorry, you can only unpin messages in a thread you own").catch(e => console.error(e)); }
            //if it's not a thread
            if (!userIsAdmin && !channelOwner) { 
                return message.reply("sorry, you can't unpin messages here").catch(e => console.error(e)); }

            try {
                await targetMessage.unpin()
                if (targetMessage.content) {
                    const targetMessageContent = targetMessage.content.replace("\n", " ")
                    const maxMessageLength = 50
                    await message.reply(`\`${(targetMessageContent.length > maxMessageLength ? `${targetMessageContent.substring(0, maxMessageLength)}...` : targetMessageContent)}\` unpinned successfully!`).catch(e => console.error(e));
                } else {
                    await message.reply(`Unpinned successfully!`).catch(e => console.error(e));
                }
                
            } catch (err) { console.error(err) }
        }
    }
}