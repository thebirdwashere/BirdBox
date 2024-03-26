const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
		.setName('pin/unpin')
        .setType(ApplicationCommandType.Message),
    async execute(interaction, {admins}) {

        const targetMessage = interaction.targetMessage

        //decide to use pin or unpin
        if (!targetMessage.pinned) {
            if (!userCanPin(interaction, targetMessage, admins)) {return;}

            try { 
                await targetMessage.pin()
            } catch (err) { console.error(err) }

            await interaction.reply({ content: 'pinning...', ephemeral: true });
            await interaction.deleteReply(); //had to use bailey's code and yep it's janky

        } else {
            if (!userCanUnpin(interaction, targetMessage, admins)) {return;}

            try {
                await targetMessage.unpin()
                await interaction.reply(`"${targetMessage}" unpinned successfully!`);
            } catch (err) { console.error(err) }
        }
    }
}

function userCanPin(interaction, messageBeingPinned, admins) {
    const channelOwner = messageBeingPinned.channel.ownerId
    const interactionUser = interaction.member.id
  
    //if it's already pinned
    if (messageBeingPinned.pinned) { interaction.reply({ content: "bruh that message is already pinned", ephemeral: true }); return false;}
  
    //override if birdbox developer
    if (admins.map(user => user.userId).includes(interactionUser)) {return true;}
  
    //if it's a thread
    if (channelOwner && channelOwner !== interactionUser) { interaction.reply({ content: "sorry, you can only pin messages in a thread you own", ephemeral: true }); return false; }
  
    return true;
}

function userCanUnpin(interaction, messageBeingPinned, admins) {
    const channelOwner = messageBeingPinned.channel.ownerId
    const interactionUser = interaction.member.id

    //override if birdbox developer
    if (admins.map(user => user.userId).includes(interactionUser)) {return true;}
  
    //if it's a thread
    if (channelOwner && channelOwner !== interactionUser) { interaction.reply({ content: "sorry, you can only unpin messages in a thread you own", ephemeral: true }); return false; }
    //if it's not a thread
    if (!channelOwner) { interaction.reply({ content: "sorry, you can't unpin messages here", ephemeral: true }); return false; }
  
    return true;
}