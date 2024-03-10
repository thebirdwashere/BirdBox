module.exports = {
  name: 'pin',
  description: "Pin a message by replying to it. (why discord no make this perm)",
  async execute({message}, {devs}){
        let repliedMessage = null;

        try {
          repliedMessage = await message.fetchReference();

          if (!userCanPin(message, repliedMessage, devs)) {return;}

          try { 
            await repliedMessage.pin()
          } catch { err => console.error(err) }
        } catch {
          message.tryreply("try again, please reply to the message you want pinned");
        }
    }
}

function userCanPin(message, repliedMessage, devs) {
  const channelOwner = repliedMessage.channel.ownerId
  const messageAuthor = message.author.ids

  //if it's already pinned
  if (repliedMessage.pinned) { message.tryreply("bruh that message is already pinned"); return false;}

  //override if birdbox developer
  if (devs.includes(message.author.id)) {return true;}

  //if it's a thread
  if (channelOwner && channelOwner !== messageAuthor) { message.tryreply("sorry, you can only pin messages in a thread you own"); return false; }

  return true;
}