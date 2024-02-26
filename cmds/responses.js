module.exports = {
  name: 'responses',
  description: "adds and deletes bot message responses",
  async execute({message, args}, {prefix, devs, db}){
    const filter = m => m.author.id == message.author.id; //used in message awaits; just doing as stackoverflow guy says
    const type = args[0];
    const action = args[1];

    const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) == "enable")

    let response = message.content.replace(`${prefix}responses ${type} ${action}`, "")
      
    if (type == "message") {
        if (action == "add") {
            if (!devs.includes(message.author.id)) {
                //aborts addition because user does not have perms to add
                message.channel.trysend("sorry, you must be a dev to add something"); return; }

            if (!classic) { require("../modernmode").responses_add_message({message, args}, {prefix, devs, db}); return; } //redirect in case of modern mode

            let messageArray = await db.get('messages')
            console.table(messageArray)

            if (!messageArray) {
                const defaultMessageArray = {};
                await db.set('messages', defaultMessageArray); //default array if nothing is present
                messageArray = defaultMessageArray
            }

            let keys = {};
            let keystring = ""

            //response
            if (!response) {
                message.channel.trysend("Enter the response you want to send.");
                await message.channel.awaitMessages({filter, max: 1, time: 300_000,/* five minute timer */ errors: ['time']}).then(collected => {
                    response = collected.first().content.trim();
            }).catch(console.error)}
            else {response = response.trim()}

            //keywords
            message.channel.trysend("Enter keywords you will accept for this message. \nMake sure to separate responses with commas, not spaces.");           
            await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                keystring = collected.first().content
            }).catch(console.error)

            keys = keystring.split(",")

            let failed = false
            keys.forEach((item) => { 
                if (messageArray[keystring]) {message.channel.trysend(`Error: please use a different keyword. \nOne of these keywords is already in use for this response: ${messageArray[keystring]}`); failed = true;}
                messageArray[item.trim()] = response;
            })

            //confirm/error to user
            if (failed) {return;} 
            else if (!(response && keystring)) {
                message.channel.trysend("Response has failed to add, please try again. Make sure you provided both a response and some keywords."); 
                return;
            } else { message.channel.trysend(`${response} added successfully!`); }

            dbset('messages', messageArray)

        } else if (action == "delete" || action == "remove") {
            if (!devs.includes(message.author.id)) {
                //aborts addition because user does not have perms to delete
                message.channel.trysend("sorry, you must be a dev to delete something"); return; }

            let messageArray = await db.get('messages')
            if (!messageArray) {
                message.channel.trysend(`there's not even any responses for me to delete lol`)
                return;
            }

            //response
            if (!response) {
                message.channel.trysend("Enter the response you want to delete.");
                await message.channel.awaitMessages({filter, max: 1, time: 300_000,/* five minute timer */ errors: ['time']}).then(collected => {
                    response = collected.first().content.trim();
            }).catch(console.error)}
            else {response = response.trim()}

            if (!devs.includes(message.author.id)) {
                //aborts delete because user does not have perms to delete
                message.channel.trysend("sorry, you must be a dev to delete something"); return;}
            if (!response) 
                //aborts delete because no selection
                {message.channel.trysend(`bruh, i need something to delete. please use the format ${prefix} responses message delete (message)`); return;}
            if (!(Object.keys(messageArray).find(key => messageArray[key] === response))) {
                //aborts delete because nothing at the selection
                message.channel.trysend(`can't find anything with the response of ${response}`); return; }

            message.channel.trysend(`Are you SURE you want to delete response ${response}?`);
            message.channel.trysend('Confirm with "y" in the next ten seconds.');
            //await the user confirming with "y" or "Y"
            await message.channel.awaitMessages({filter, max: 1, time: 10_000,/* ten second timer */ errors: ['time']}).then(collected => {
                if (collected.first().content.toUpperCase() == "Y") {
                    for (const key in messageArray) {
                        if (messageArray[key] === response) {
                          delete messageArray[key];
                        }
                      }
                    message.channel.trysend("PURGING SUCCESSFUL, HUMAN"); //birdbox sentience confirmed??????? (borderline easter egg)
                } else {
                    message.channel.trysend("Response delete averted.");
                }
            }).catch(() => {message.channel.trysend("Response delete failed, please try again.");})
            
            dbset('messages', messageArray)
        }
    } else if (type == "lyric") {
        if (action == "add") {
            if (!devs.includes(message.author.id)) {
                //aborts addition because user does not have perms to add
                message.channel.trysend("sorry, you must be a dev to add something"); return; }

            if (!classic) { require("../modernmode").responses_add_lyric({message, args}, {prefix, devs, db}); return; } //redirect in case of modern mode
        
            let lyricArray = await db.get('lyrics')
            console.table(lyricArray)

            if (!lyricArray) {
                const defaultlyricArray = [];
                await db.set('lyrics', defaultlyricArray); //default array if nothing is present
                lyricArray = defaultlyricArray
            }

            let lyric = {title: "", content: []}

            //response
            if (!response) {
            message.channel.trysend("Enter the title of this song. (The title is only used for later deletion.)");
            await message.channel.awaitMessages({filter, max: 1, time: 300_000,/* five minute timer */ errors: ['time']}).then(collected => {
                lyric.title = collected.first().content.trim();
            }).catch(console.error)}
            else {lyric.title = response.trim()}

            for (let i = 0; i < lyricArray.length; i++) {
                if (lyric.title == lyricArray[i].title) {
                    message.channel.trysend("already used that title, try a different one");
                    return;
                }
            }

            let i = 0
            let line

            message.channel.trysend(`Please type the lyrics you want the bot to use. Each message is interpreted as one lyric, with edits not being detected. \nPunctuation and capitalization do not affect detection, but do affect the bot's messages. \nUse ${prefix}stop to finish the song, and ${prefix}cancel to end addition prematurely.`);

            await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                line = collected.first()
                collected.first().react('✅');
            }).catch(console.error);

            while (!line.content.includes(`${prefix}stop`) && !line.content.includes(`${prefix}cancel`)) {
                lyric.content[i] = line.content.trim().replace(/[^\w\s]/gi, "");; i++

                await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                    line.reactions.removeAll()
                    line = collected.first()
                    if (collected.first().content !== `${prefix}stop`) {collected.first().react('✅');}
                }).catch(console.error);
            }

            if (line.content == `${prefix}cancel`) {
                message.channel.trysend(`Song addition has been cancelled.`);
                line.reactions.removeAll()
                return;
            }

            console.table(lyric.content)
            lyricArray[lyricArray.length] = lyric

            dbset('lyrics', lyricArray)

            message.channel.trysend(`${lyric.title} has successfully been added!`);

        } else if (action == "delete" || action == "remove") {
            if (!devs.includes(message.author.id)) {
                //aborts addition because user does not have perms to delete
                message.channel.trysend("sorry, you must be a dev to delete something"); return; }
                
            let lyricArray = await db.get('lyrics')
            if (!lyricArray) {
                message.channel.trysend(`there's not even any lyrics for me to delete lol`)
                return;
            }

            //response
            if (!response) {
                message.channel.trysend("Enter the title of the song you want to delete.");
                await message.channel.awaitMessages({filter, max: 1, time: 300_000,/* five minute timer */ errors: ['time']}).then(collected => {
                    response = collected.first().content.trim();
                }).catch(console.error)}
                else {response = response.trim()}

            function testTitles(title, array) {
                console.table(array)
                for (let i = 0; i < array.length; i++) {
                    console.log(array[i].title)
                    if (array[i].title == title) {
                      return i;
                    }
                }
                return false;
            }

            if (!devs.includes(message.author.id)) {
                //aborts delete because user does not have perms to delete
                message.channel.trysend("sorry, you must be a dev to delete something"); return;}
            if (!response) 
                //aborts delete because no selection
                {message.channel.trysend(`bruh, i need something to delete. please use the format ${prefix}responses message delete (message)`); return;}
            if (testTitles(response, lyricArray) === false) { //actually had to use triple equals here bc index 0 was getting type coerced into being false, i have seen the light
                //aborts delete because nothing at the selection
                message.channel.trysend(`can't find anything with the title of "${response}"`); return; }
    
            message.channel.trysend(`Are you SURE you want to delete response ${response}?`);    
            message.channel.trysend('Confirm with "y" in the next ten seconds.');   

            //await the user confirming with "y" or "Y"
            await message.channel.awaitMessages({filter, max: 1, time: 10_000,/* ten second timer */ errors: ['time']}).then(collected => {
                if (collected.first().content.toUpperCase() == "Y") {
                    lyricArray.splice(testTitles(response, lyricArray), 1);
                    //birdbox sentience confirmed??????? (borderline easter egg)
                    message.channel.trysend("PURGING SUCCESSFUL, HUMAN");
                } else {
                    message.channel.trysend("Response delete averted.");
                }
            }).catch(() => {message.channel.trysend("Response delete failed, please try again.");})
            
            dbset('lyrics', lyricArray)
        } else if (action) {
            message.channel.trysend(`please use ${prefix}responses message/lyric add/delete cause idk what "${action}" is`); 
        } else {
            message.channel.trysend(`please use ${prefix}responses message/lyric add/delete cause idk what "" is`); 
        }
    } else if (type) {
        message.channel.trysend(`please use ${prefix}responses message/lyric add/delete cause idk what "${type}" is`);
    } else {
        message.channel.trysend(`please use ${prefix}responses message/lyric add/delete cause idk what "" is`);
    }

    async function dbset(name, array) { //this function is needed since variables declared in blocks only can be used in those blocks
        await db.set(name, array)
        console.table(await db.get(name))
    }
  }
}