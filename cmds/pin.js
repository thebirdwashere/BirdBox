module.exports = {
  name: 'pin',
  description: "command to pin a replied to message",
  async execute(message){
        const messageAuthor = message.author.id
        let repliedMessage = null;

        try {
          repliedMessage = await message.fetchReference();
          const channelOwner = repliedMessage.channel.ownerId

          //if it's already pinned
          if (repliedMessage.pinned) { message.tryreply("bruh that message is already pinned"); return;}

          //if it's a thread
          if (channelOwner && channelOwner !== messageAuthor) { message.tryreply("sorry, you can only pin messages in a thread you own"); return; }

          try { 
            await repliedMessage.pin()
          } catch { console.error }
        } catch {
          message.tryreply("try again, please reply to the message you want pinned");
        }
    }
}