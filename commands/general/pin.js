const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('pin')
		.setDescription('Pin a message by ID or link.')
        .addStringOption(option =>
			option
				.setName('message')
				.setDescription('The message ID or link to pin.')
				.setRequired(true)
        ),
    async execute(interaction, {admins}) {

        const targetMessageId = interaction.options.getString('message').replace(`https://discord.com/channels/${interaction.guildId}/${interaction.channel.id}/`, "");
        let targetMessage

        try {
            targetMessage = await interaction.channel.messages.fetch(targetMessageId)
        } catch {
            return interaction.reply({ content: "that's not a message id or link lol", ephemeral: true });
        }
        
        const channelOwner = targetMessage.channel.ownerId
        const interactionUser = interaction.member.id
        const userIsAdmin = admins.map(user => user.userId).includes(interactionUser) //admins get bypass on any check
        
        if (!targetMessage.pinned) {

            //if it's a thread
            if (!userIsAdmin && channelOwner && channelOwner !== interactionUser) 
                { return interaction.reply({ content: "sorry, you can only pin messages in a thread you own", ephemeral: true }); }

            try { 
                await targetMessage.pin()
            } catch (err) { console.error(err) }

            await interaction.reply({ content: 'pinning...', ephemeral: true });
            await interaction.deleteReply(); //had to use bailey's code and yep it's janky

        } else { //if it's already pinned

            //if it's a thread
            if (!userIsAdmin && channelOwner && channelOwner !== interactionUser) {
                return interaction.reply({ content: "sorry, you can only unpin messages in a thread you own", ephemeral: true }); }
            //if it's not a thread
            if (!userIsAdmin && !channelOwner) { 
                return interaction.reply({ content: "sorry, you can't unpin messages here", ephemeral: true }); }

            try {
                await targetMessage.unpin()
                if (targetMessage.content) {
                    await interaction.reply(`"${targetMessage.content}" unpinned successfully!`);
                } else {
                    await interaction.reply(`Unpinned successfully!`);
                }
                
            } catch (err) { console.error(err) }
        }
    },
    async executeClassic({message, args}, {admins}) {

        const targetMessageId = args[0].replace(`https://discord.com/channels/${message.guildId}/${message.channel.id}/`, "")
        let targetMessage

        try {
            targetMessage = await message.fetchReference();
        } catch (err) {
            try {
                targetMessage = await message.channel.messages.fetch(targetMessageId)
            } catch (err) {
                message.reply("try again, either reply to the message you want pinned or give me its id/link");
            }
        }
        
        const channelOwner = targetMessage.channel.ownerId
        const pinningUser = message.author.id
        const userIsAdmin = admins.map(user => user.userId).includes(pinningUser) //admins get bypass on any check
        
        if (!targetMessage.pinned) {

            //if it's a thread
            if (!userIsAdmin && channelOwner && channelOwner !== pinningUser) 
                { return message.reply("sorry, you can only pin messages in a thread you own"); }

            try { 
                await targetMessage.pin()
            } catch (err) { console.error(err) }

        } else { //if it's already pinned

            //if it's a thread
            if (!userIsAdmin && channelOwner && channelOwner !== pinningUser) {
                return message.reply("sorry, you can only unpin messages in a thread you own"); }
            //if it's not a thread
            if (!userIsAdmin && !channelOwner) { 
                return interaction.reply("sorry, you can't unpin messages here"); }

            try {
                await targetMessage.unpin()
                if (targetMessage.content) {
                    await message.reply(`"${targetMessage.content}" unpinned successfully!`);
                } else {
                    await message.reply(`Unpinned successfully!`);
                }
                
            } catch (err) { console.error(err) }
        }
    }
}



