module.exports = {
  name: 'pin',
  description: "Pin a message by replying to it. (why discord no make this perm)",
  async execute({message}, {devs, db}){
        let repliedMessage = null;

        try {
          repliedMessage = await message.fetchReference();

          if (!userCanPin(message, repliedMessage, {devs, db})) {return;}

          try { 
            await repliedMessage.pin()
          } catch { err => console.error(err) }
        } catch {
          message.tryreply("try again, please reply to the message you want pinned");
        }
    }
}

async function userCanPin(message, repliedMessage, {devs, db}) {
  const threadOwner = repliedMessage.channel.ownerId
  const messageAuthor = message.author.id
  
  const pinSetting = await db.get(`settings.pinning.${message.guildId}`)
  const userIsDev = devs.includes(message.author.id)
  const threadOwnerNotPinner = (threadOwner && threadOwner !== messageAuthor)

  //if it's already pinned
  if (repliedMessage.pinned) { message.tryreply("bruh that message is already pinned"); return false;}

  console.log("what is " + pinSetting)

  if (pinSetting == "enable") { //just enabled for absolutely everyone
    return true;
  } else if (userIsDev) { //works for devs regardless of setting
    return true;
  } else if (pinSetting == "disable") { //does not work for anyone except devs
    message.tryreply("sorry, pinning is disabled for everyone in this server"); return false;
  } else if (threadOwnerNotPinner) {  //can only pin messages in a thread if you own it
    message.tryreply("sorry, you can only pin messages in a thread you own"); return false; 
  } else { //any other circumstance is fine for pinning
    return true;
  }
}