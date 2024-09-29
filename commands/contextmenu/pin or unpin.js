const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { getSettingValue } = require("../../utils/scripts/util_scripts")

module.exports = {
    data: new ContextMenuCommandBuilder()
		.setName('pin or unpin')
        .setType(ApplicationCommandType.Message),
    async execute(interaction, {admins, db}) {

        const targetMessage = interaction.targetMessage
        
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
    async executeClassic({message}, {prefix}) {
        //they'll never know (not that they should see this anyway)
        message.reply(`The command \`${prefix}pin or unpin\` was not found.`)
    }
}