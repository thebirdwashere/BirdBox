module.exports = {
  name: 'unpin',
  description: "Unpin a message by replying to it. (again, why no seperate perm discord)",
  async execute({message}, {devs, db}){
        let repliedMessage = null;

        try {
          repliedMessage = await message.fetchReference();

          if (!userCanUnpin(message, repliedMessage, {devs, db})) {return;}

          try { 
            await repliedMessage.unpin()
            message.tryreply("Unpinned successfully!");
          } catch { err => console.error(err) }
        } catch {
          message.tryreply("try again, please reply to the message you want unpinned");
        }
  }
}

async function userCanUnpin(message, repliedMessage, {devs, db}) {
  const threadOwner = repliedMessage.channel.ownerId
  const messageAuthor = message.author.id

  const pinSetting = await db.get(`setting_pinning_${message.guildId}`)
  const userIsDev = devs.includes(message.author.id)
  const threadOwnerNotPinner = (threadOwner && threadOwner !== messageAuthor)

  //check if it's even pinned lol
  if (!repliedMessage.pinned) { message.tryreply("bruh that message isn't even pinned"); return false;}

  if (pinSetting == "enable") { //just enabled for absolutely everyone
    return true;
  } else if (userIsDev) { //override if birdbox developer
    return true;
  } else if (pinSetting == "disable") { //does not work for anyone except devs
    message.tryreply("sorry, unpinning is disabled for everyone in this server"); return false;
  } else if (!threadOwner) { //can't unpin messages in non-threads anyway
    message.tryreply("sorry, you can't unpin messages here"); return false; 
  } else if (threadOwnerNotPinner) {  //can only unpin messages in a thread if you own it
    message.tryreply("sorry, you can only unpin messages in a thread you own"); return false; 
  } else { //any other circmustance is fine for unpinning
    return true;
  }
}