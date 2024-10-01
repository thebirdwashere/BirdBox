const { EmbedBuilder } = require("discord.js")
const footers = require("../json/footers.json")
const { messages, lyrics, interruptions, pings, mentionEmojis } = require("../json/messages.json")
const { getSettingValue } = require("./util_scripts")

module.exports = {
    messages: {
        check: async ({message, vars}) => { //MARK: messages
            if (!(await getSettingValue(`settings.responses.${message.guildId}`, vars.db))) return;

            //filter and get message content for detection
            const filterRegex = /[^A-Za-z\s!?]/g;
            const content = message.content.toLowerCase().replace(filterRegex,'').trim();

            //get message-type responses and sort by length
            const messagesMap = new Map([...new Map(Object.entries(messages))].sort((a, b) => a[1].length - b[1].length));

            //test for message-type responses
            for (let [key, val] of messagesMap) {
                if (content.includes(key)) {
                    return val;
                }
            }
        },
        respond: async ({message, testResult}) => {
            await message.reply(testResult).catch(e => console.error(e));
        }
    },
    lyrics: {
        check: async ({message, vars}) => { //MARK: lyrics
            if (!(await getSettingValue(`settings.responses.${message.guildId}`, vars.db))) return;

            //filter and get message content for detection
            const filterRegex = /[^A-Za-z\s!?]/g;
            const content = message.content.toLowerCase().replace(filterRegex,'').trim();

            /*/
                * first, previous lyric detection
                * to explain what's going on here, consider the chorus of all star
                *
                * -> hey now / you're an allstar
                *    get your game on / go play
                * -> hey now / you're a rockstar
                *    get the show on / get paid
                * 
                * notice how the same lyric appears twice?
                * without intervention, soneone naively trying to recite the chorus
                * would reset back to the beginning every time "hey now" comes up
                * 
                * this can be fixed by considering the place we are in the song
                * here, before anything else, we're looking at the previous message
                * to determine our place
                * 
                * to demonstrate, all-star:
                * you: get your game on
                * birdbox: go play
                * you: hey now
                * 
                * birdbox sees the previous message was a lyric, 
                * and sees that this one comes right after it
                * so it correctly follows up with "you're a rockstar"
                * 
                * ok agentnebulator yapfest over
                * this comes to you from a vc on august 11th 2024, bisly and kek are in the back
                * listening to kirin j callinan's big enough, schlatt's my way, and assorted memes
                * good times all around
                * 
            /*/

            //get lyric responses in a flattened form (to facilitate a broad lyric check)
            const flattenedLyrics = lyrics.reduce((a, b) => a.concat(b));

            //get the message before this one
            const previousMessages = await message.channel.messages.fetch({limit:2});
            const lastMessage = previousMessages.last();

            //if the previous message was a lyric (tested using flattened lyrics)...
            if (flattenedLyrics.includes(lastMessage.content)) {
                //and if this message matches what should come next...
                const previousLyricIndex = flattenedLyrics.indexOf(lastMessage.content);
                if (message.content == flattenedLyrics[previousLyricIndex + 1].replace(filterRegex,'').trim()) {
                    //return the lyric after
                    return flattenedLyrics[previousLyricIndex + 2];
                }
            }

            //check lyrics normally
            let decidedLyric = "";
            for (const song of lyrics) { for (const lyric of song) {
                if (content.endsWith(lyric.replace(filterRegex,'').trim())) {
                    //ensure the chosen lyric is the longest one that fits
                    if (lyric.length >= decidedLyric?.length) {
                        const lyricIndex = song.indexOf(lyric);
                        decidedLyric = song[lyricIndex + 1];
                    }
                }
            }}

            //return lyric
            return decidedLyric;
        },
        respond: async ({message, testResult}) => {
            await message.reply(testResult).catch(e => console.error(e));
        }
    },
    alphabetical: {
        check: ({message}) => { //MARK: alphabetical
            const content = message.content.toLowerCase();

            if (content.length > 1935) return;       //message is too long for embeds
            if (/[^a-zA-Z\s]/.test(content)) return; //check for non-alphabetic characters

            const splitContent = content.split(" ").filter(word => word !== "");
            
            if (splitContent.length < 5) return;                              //stop if less than 5 words
            if (splitContent.some(word => word.startsWith(":"))) return;      //stop if any emojis
            if ((new Set(splitContent)).size !== splitContent.length) return; //stop if any duplicate words
            
            //sort content alphabetically
            const sortedContent = [...splitContent].sort(); 

            //if the sorted content is the same, logically,
            //the original message was in alphabetical order
            if (splitContent.join(" ") === sortedContent.join(" ")) { 
                return splitContent.map(word => {return word[0].toUpperCase() + word.substring(1)}); //bolden each first letter
            }
        },
        respond: async ({message, vars, testResult}) => {
            //get the random footer for the embed
            const randomWord = testResult[Math.floor(Math.random() * testResult.length)];
            const randomLetter = randomWord[0].toUpperCase();
            const randomFooter = footers.alphabetical[Math.floor(Math.random() * footers.alphabetical.length)].replace("(randomWord)", randomWord).replace("(randomLetter)", randomLetter);
            
            //get alphabetical version
            const alphabeticalString = testResult.join(" ");

            const notifSetting = await getSettingValue(`settings.notifs.${message.author.id}`, vars.db)
            const notifChannel = await getSettingValue(`settings.notif_channel.${message.guildId}`, vars.db)
            
            if (notifSetting == "reply") { //other cases require a reply
                message.reply(`:abc: Your message is in perfect alphabetical order! \n\`${alphabeticalString}\``).catch(e => console.error(e));
            }

            let notifchannel = false //by default, do not log
            await message.guild.channels.fetch(notifChannel).then(channel => {
                if (!(channel instanceof vars.Discord.Collection)) notifchannel = channel; //for logged responses, overwrites default if found
            }) 
            
            if (notifchannel) {
                const ping = notifSetting == "log" ? `<@${message.author.id}>` : ""; //only ping if no reply
                
                const alphabeticalSplit = alphabeticalString.match(/(.{1,1000})/g); //make sure we don't go over embed char limits
        
                const newEmbed = new EmbedBuilder().setColor(0x3b88c3)
                    .setTitle(`| :abc: | ${message.author.displayName}'s message`)
                    .setDescription(`is in perfect alphabetical order! Take a look:`)
                    .addFields({name: " ", value: " "})
                    .setURL(message.url)
                    .setFooter({text: randomFooter});
        
                alphabeticalSplit.forEach(str => { //embed char limits once again
                    newEmbed.addFields({name: " ", value: `\`${str}\``});
                }) 
                newEmbed.addFields({name: " ", value: " "});
        
                await notifchannel.send({content: ping, embeds: [newEmbed]}).catch(e => console.error(e)); //only send notif if there is a log channel
            }
        }
    },
    periodictable: {
        check: ({message}) => { //MARK: periodic
            let content = message.content.toLowerCase();

            if (content.length > 973) return;                             //this checks if the message is empty or too long
            if (content.match(/[^a-zA-Z\s]/)) return;                     //this tests for non-alphabetical characters
            if (content.includes("j") || content.includes("q")) return;   //no j or q on the periodic table, fun fact

            if (content.length < 20) return;                              //only test strings with more than 20 characters, for coolness factor

            if (content.endsWith("x")) return;                            //another fun fact: x only starts a two-letter combo, so cannot end it
            const impossibleEndings = ["aa", "ad", "ae", "az", "bd", "bg", "bl", "bm", "bt", "bz", "cg", "ct", "cz", "da", "dd", "de", "dg", "dl", "dm", "dr", "dt", "dz", "ea", "ed", "ee", "eg", "el", "em", "et", "ez", "fa", "fd", "fg", "ft", "fz", "gg", "gl", "gm", "gr", "gt", "gz", "ha", "hd", "hl", "hm", "hr", "ht", "hz", "ia", "id", "ie", "ig", "il", "im", "it", "iz", "ka", "kd", "ke", "kg", "kl", "km", "kt", "kz", "ld", "le", "lg", "ll", "lm", "lt", "lz", "ma", "me", "ml", "mm", "mr", "mz", "ng", "nl", "nm", "nr", "nt", "nz", "oa", "od", "oe", "ol", "om", "or", "ot", "oz", "pe", "pg", "pl", "pz", "rd", "rl", "rm", "rr", "rt", "rz", "sa", "sd", "sl", "st", "sz", "td", "tg", "tr", "tt", "tz", "ua", "ud", "ue", "ug", "ul", "um", "ur", "ut", "uz", "va", "vd", "ve", "vg", "vl", "vm", "vr", "vt", "vz", "wa", "wd", "we", "wg", "wl", "wm", "wr", "wt", "wz", "xa", "xb", "xc", "xd", "xf", "xg", "xh", "xi", "xk", "xl", "xm", "xn", "xo", "xp", "xr", "xs", "xt", "xu", "xv", "xw", "xy", "xz", "ya", "yd", "ye", "yg", "yl", "ym", "yr", "yt", "yz", "za", "zb", "zc", "zd", "ze", "zf", "zg", "zh", "zi", "zk", "zl", "zm", "zo", "zp", "zs", "zt", "zu", "zv", "zw", "zy", "zz"]
            if (impossibleEndings.includes(content.slice(-2))) return;    //all of these also impossible endings to a message (btw i'm bothering to check the ending super well because it's going to take a while to get there with this algorithm, and figuring out which endings are impossible is relatively straightforward with another algoritm i made elsewhere. it's already super fast so i really don't have to do this, but i am bored on winter break and terrified to push this complicated update)

            const ones = ["h","b","c","n","o","f","p","s","k","v","y","i","w","u"]; 
            const twos = ["he","li","be","ne","na","mg","al","si","cl","ar","ca","sc","ti","cr","mn","fe","co","ni","cu","zn","ga","ge","as","se","br","kr","rb","sr","zr","nb","mo","tc","ru","rh","pd","ag","cd","in","sn","sb","te","xe","cs","ba","la","ce","pr","nd","pm","sm","eu","gd","tb","dy","ho","er","tm","yb","lu","hf","ta","re","os","ir","pt","au","hg","tl","pb","bi","po","at","rn","fr","ra","ac","th","pa","np","pu","am","cm","bk","cf","es","fm","md","no","lr","rf","db","sg","bh","hs","mt","ds","rg","cn","nh","fl","mc","lv","ts","og"];

            content = content.replace(/\s+/g, " ").trim() //https://stackoverflow.com/questions/6163169/replace-multiple-whitespaces-with-single-whitespace-in-javascript-string

            function periodicCheck(array, index) {
                if (content.length <= index) return array;

                let oneChar = content[index].toUpperCase();
                let twoChar = content[index].toUpperCase().concat(content[index + 1]?.toLowerCase());

                if (/\s/.test(oneChar)) {
                    array.push(oneChar);
                    return periodicCheck([...array], index + 1);
                }

                let spacedTwoChar = twoChar
                if (/\s/.test(twoChar)) {
                    spacedTwoChar = content[index].toUpperCase().concat(" ").concat(content[index + 2]?.toLowerCase());
                }

                if (twos.includes(twoChar.toLowerCase()) && ones.includes(oneChar.toLowerCase())) { 
                    array.push(spacedTwoChar);

                    const twoCheck = periodicCheck([...array], index + 2);

                    if (twoCheck) return twoCheck; else {
                        array.pop(); array.push(oneChar);
                        return periodicCheck([...array], index + 1);
                    }

                } else if (twos.includes(twoChar.toLowerCase())) { 
                    array.push(spacedTwoChar);

                    return periodicCheck([...array], index + 2);
                } else if (ones.includes(oneChar.toLowerCase())) {
                    array.push(oneChar);
                    
                    return periodicCheck([...array], index + 1);
                }

                return null;
            }

            const tableArray = periodicCheck([], 0);

            if (tableArray) { //if a value was returned
                const uniqueItems = [...new Set(tableArray)];

                if (uniqueItems.length > 5) {
                    return tableArray.join("");
                }
            }
        },
        respond: async ({message, vars, testResult}) => {
            const randomFooter = footers.periodic[Math.floor(Math.random() * footers.periodic.length)].replace("(userName)", message.author.username);

            const periodicString = testResult;
            
            if (await getSettingValue(`settings.notifs.${message.author.id}`, vars.db) !== "log") { //other cases require a reply
                await message.reply(`:test_tube: Your message is on the periodic table! \n\`${periodicString}\``).catch(e => console.error(e));
            }

            let notifchannel = false //by default, do not log
            await message.guild.channels.fetch(await getSettingValue(`settings.notif_channel.${message.guildId}`, vars.db)).then(channel => {
                if (!(channel instanceof vars.Discord.Collection)) notifchannel = channel; //for logged responses, overwrites default if found
            }) 
            
            if (notifchannel) {
                const ping = await getSettingValue(`settings.notifs.${message.author.id}`, vars.db) == "log" ? `<@${message.author.id}>` : ""; //only ping if no reply
                
                const periodicSplit = periodicString.match(/(.{1,1000})/g); //make sure we don't go over embed char limits
        
                const newEmbed = new EmbedBuilder().setColor(0x21c369)
                    .setTitle(`| :test_tube: | ${message.author.displayName}'s message`)
                    .setDescription(`is on the periodic table! Take a look:`)
                    .addFields({name: " ", value: " "})
                    .setURL(message.url)
                    .setFooter({text: randomFooter});
        
                    periodicSplit.forEach(str => { //embed char limits once again
                        newEmbed.addFields({name: " ", value: `\`${str}\``});
                    })
                    newEmbed.addFields({name: " ", value: " "});
        
                await notifchannel.send({content: ping, embeds: [newEmbed]}).catch(e => console.error(e)); //only send notif if there is a log channel
            }
        }
    },
    pangrams: {
        check: async ({message}) => { //MARK: pangrams
            const alphabet = "abcdefghijklmnopqrstuvwxyz".split("")
            let content = message.content.toLowerCase()
            
            for (const letter of alphabet) {
                if (!content.includes(letter)) return;
                const letterIndex = content.indexOf(letter)
                content = `${content.slice(0, letterIndex)}${letter.toUpperCase()}${content.slice(letterIndex + 1)}`
            }

            return content
        },
        respond: async ({message, vars, testResult}) => {
            const randomFooter = footers.pangrams[Math.floor(Math.random() * footers.pangrams.length)].replace("(userName)", message.author.username);

            const pangramString = testResult;
            
            if (await getSettingValue(`settings.notifs.${message.author.id}`) !== "log") { //other cases require a reply
                await message.reply(`:capital_abcd: Your message contains every letter in the alphabet! \n\`${pangramString}\``).catch(e => console.error(e));
            }

            let notifchannel = false //by default, do not log
            await message.guild.channels.fetch(await getSettingValue(`settings.notif_channel.${message.guildId}`, vars.db)).then(channel => {
                if (!(channel instanceof vars.Discord.Collection)) notifchannel = channel; //for logged responses, overwrites default if found
            }) 
            
            if (notifchannel) {
                const ping = await getSettingValue(`settings.notifs.${message.author.id}`, vars.db) == "log" ? `<@${message.author.id}>` : ""; //only ping if no reply
                
                const pangramSplit = pangramString.match(/(.{1,1000})/g); //make sure we don't go over embed char limits
        
                const newEmbed = new EmbedBuilder().setColor(0x21c369)
                    .setTitle(`| :capital_abcd: | ${message.author.displayName}'s message`)
                    .setDescription(`contains every letter in the alphabet! Take a look:`)
                    .addFields({name: " ", value: " "})
                    .setURL(message.url)
                    .setFooter({text: randomFooter});
        
                    pangramSplit.forEach(str => { //embed char limits once again
                        newEmbed.addFields({name: " ", value: `\`${str}\``});
                    })
                    newEmbed.addFields({name: " ", value: " "});
        
                await notifchannel.send({content: ping, embeds: [newEmbed]}).catch(e => console.error(e)); //only send notif if there is a log channel
            }
        }
    },
    jinx: {
        check: async ({message, vars}) => { //MARK: jinx
            if (!(await getSettingValue(`settings.jinxes.${message.guildId}`, vars.db))) return;

            const previousMessages = await message.channel.messages.fetch({limit:2});
            const lastMessage = previousMessages.last();

            const jinxMsWindow = 2000;

            //the required tests
            const jinxCreatedCloseTogether = Math.abs(lastMessage.createdTimestamp - message.createdTimestamp) <= jinxMsWindow;
            const contentIsIdentical = lastMessage.content == message.content;
            const jinxFromDifferentPeople = lastMessage.author.id !== message.author.id;

            //only pass if all true
            if (jinxCreatedCloseTogether && contentIsIdentical && jinxFromDifferentPeople) {
                return lastMessage.content;
            } else return;
            
        },
        respond: async ({message, testResult}) => {
            await message.channel.send(testResult).catch(e => console.error(e));
        }
    },
    interruption: {
        check: async () => { //MARK: interruption
            const chanceOfInterrupting = 1000;
            const randomInt = Math.floor(Math.random() * chanceOfInterrupting) + 1;

            if (randomInt == chanceOfInterrupting) {
                const randomInterruption = interruptions[Math.floor(Math.random() * interruptions.length)];
                return randomInterruption;
            }
        },
        respond: async ({message, testResult}) => {
            await message.channel.send(testResult).catch(e => console.error(e));
        },
    },
    pings: {
        check: async ({message, vars}) => { //MARK: pings
            const clientId = vars.client.user.id;
            if (message.content.includes(`<@${clientId}>`)) {
                const randomReply = pings[Math.floor(Math.random() * pings.length)];
                return randomReply;
            }
        },
        respond: async ({message, testResult}) => {
            await message.channel.send(testResult).catch(e => console.error(e));
        }
    },
    mentions: {
        check: async ({message}) => { //MARK: mentions
            if (message.content.toLowerCase().includes("birdbox")) {
                return mentionEmojis[Math.floor(Math.random() * mentionEmojis.length)]
            }
        },
        respond: async ({message, testResult}) => {
            await message.react(testResult).catch(e => console.error(e));
        }
    }
}