module.exports = {
  name: 'unpin',
  description: "command to unpin a replied to message",
  async execute({message}){
        const messageAuthor = message.author.id
        let repliedMessage = null;

        try {
          repliedMessage = await message.fetchReference();
          const channelOwner = repliedMessage.channel.ownerId

          //check if it's even pinned lol
          if (!repliedMessage.pinned) { message.tryreply("bruh that message isn't even pinned"); return;}

          //if it's a thread
          if (channelOwner && channelOwner !== messageAuthor) { message.tryreply("sorry, you can only unpin messages in a thread you own"); return; }
          //if it's not a thread
          if (!channelOwner) { message.tryreply("sorry, you can't unpin messages here"); return; }

          try { 
            await repliedMessage.unpin()
            message.tryreply("Unpinned successfully!");
          } catch { console.error }
        } catch {
          message.tryreply("try again, please reply to the message you want unpinned");
        }
  }
}