module.exports = {
  name: 'unpin',
  description: "command to unpin a replied to message",
  async execute({message}, {devs}){
        let repliedMessage = null;

        try {
          repliedMessage = await message.fetchReference();

          if (!userCanPin(message, repliedMessage, devs)) {return;}

          try { 
            await repliedMessage.unpin()
            message.tryreply("Unpinned successfully!");
          } catch { err => console.error(err) }
        } catch {
          message.tryreply("try again, please reply to the message you want unpinned");
        }
  }
}

function userCanPin(message, repliedMessage, devs) {
  const channelOwner = repliedMessage.channel.ownerId
  const messageAuthor = message.author.id

  //check if it's even pinned lol
  if (!repliedMessage.pinned) { message.tryreply("bruh that message isn't even pinned"); return false;}

  //override if birdbox developer
  if (devs.includes(message.author.id)) {return true;}

  //if it's a thread
  if (channelOwner && channelOwner !== messageAuthor) { message.tryreply("sorry, you can only unpin messages in a thread you own"); return false; }
  //if it's not a thread
  if (!channelOwner) { message.tryreply("sorry, you can't unpin messages here"); return false; }

  return true;
}