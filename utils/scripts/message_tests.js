const { EmbedBuilder } = require("discord.js")
const footers = require("../json/footers.json")
const { messages, lyrics } = require("../json/messages.json")

module.exports = {
    keywords: {
        check: async ({message}) => { //function for message/lyric responses
            const filterRegex = /[^A-Za-z\s!?]/g
            const content = message.content.toLowerCase().replace(filterRegex,'').trim();

            const messagesMap = new Map([...new Map(Object.entries(messages))].sort((a, b) => a[1].length - b[1].length));

            for (let [key, val] of messagesMap) {
                if (content.includes(key)) {
                    return val;
                }
            }

            const flattenedLyrics = lyrics.reduce((a, b) => a.concat(b));
            const previousMessages = await message.channel.messages.fetch({limit:2});
            const lastMessage = previousMessages.last();

            if (flattenedLyrics.includes(lastMessage.content)) {
                const previousLyricIndex = flattenedLyrics.indexOf(lastMessage.content);
                if (message.content == flattenedLyrics[previousLyricIndex + 1].replace(filterRegex,'').trim()) {
                    return flattenedLyrics[previousLyricIndex + 2];
                }
            }

            let decidedLyric = "";
            for (const song of lyrics) { for (const lyric of song) {
                if (content.endsWith(lyric.replace(filterRegex,'').trim())) {
                    if (lyric.length >= decidedLyric?.length) {
                        const lyricIndex = song.indexOf(lyric);
                        decidedLyric = song[lyricIndex + 1];
                    }
                }
            }}

            return decidedLyric
        },
        respond: async ({message, testResult}) => {
            await message.reply(testResult)
        }
    },
    alphabetical: {
        check: ({message}) => { //alphabetical order checker
            const content = message.content.toLowerCase()

            if (content.length > 1935) return; //this checks if the message is too long for embeds
            if (!/[^0-9\u{0080}-\u{FFFF}\p{M}]+/u.test(content)) return;

            const splitContent = content.split(" ").filter(word => word !== "")

            if (splitContent.length < 5) return;
            if (splitContent.some(word => word.startsWith(":"))) return;
            if (splitContent.every( (val, i, arr) => val === arr[0] )) return;
            if ((new Set(splitContent)).size !== splitContent.length) return;
            
            const sortedContent = [...splitContent].sort();

            if (splitContent.join(" ") === sortedContent.join(" ")) { 
                return splitContent.map(word => {return word[0].toUpperCase() + word.substring(1)})} //bolden each first letter
            else return;
        },
        respond: async ({message, vars, testResult}) => {
            const randomWord = testResult[Math.floor(Math.random() * testResult.length)]
            const randomLetter = randomWord[0].toUpperCase()
            const randomFooter = footers.alphabetical[Math.floor(Math.random() * footers.alphabetical.length)].replace("(randomWord)", randomWord).replace("(randomLetter)", randomLetter);
            
            const alphabeticalString = testResult.join(" ")
            
            if (await vars.db.get(`setting_notifs_${message.author.id}`) !== "log") { //other cases require a reply
                message.reply(`:capital_abcd: Your message is in perfect alphabetical order! \n\`${alphabeticalString}\``);
            }

            let notifchannel = false //by default, do not log
            await message.guild.channels.fetch(await vars.db.get(`setting_notif_channel_${message.guildId}`)).then(channel => {
                if (!(channel instanceof vars.Discord.Collection)) notifchannel = channel //for logged responses, overwrites default if found
            }) 
            
            if (notifchannel) {
                const ping = await vars.db.get(`setting_notifs_${message.author.id}`) == "log" ? `<@${message.author.id}>` : "" //only ping if no reply
                
                const alphabeticalSplit = alphabeticalString.match(/(.{1,1000})/g); //make sure we don't go over embed char limits
        
                const newEmbed = new EmbedBuilder().setColor(0x3b88c3)
                    .setTitle(`| :capital_abcd: | ${message.author.displayName}'s message`)
                    .setDescription(`is in perfect alphabetical order! Take a look:`)
                    .addFields({name: " ", value: " "})
                    .setURL(message.url)
                    .setFooter({text: randomFooter})
        
                alphabeticalSplit.forEach(str => { //embed char limits once again
                    newEmbed.addFields({name: " ", value: `\`${str}\``});
                }) 
                newEmbed.addFields({name: " ", value: " "});
        
                await notifchannel.send({content: ping, embeds: [newEmbed]}).catch(e => console.error(e)); //only send notif if there is a log channel
            }
        }
    },
    jinx: {
        check: async ({message, db}) => { //jinx checker
            const jinx = await db.get(`jinx_${message.channelId}`)
            if (!jinx) return;

            const jinxMsWindow = 2000

            //the required tests
            const jinxCreatedCloseTogether = Math.abs(jinx.timestamp - message.createdTimestamp) <= jinxMsWindow
            const contentIsIdentical = jinx.content == message.content
            const jinxFromDifferentPeople = jinx.author.id !== message.author.id

            //only pass if all true
            if (jinxCreatedCloseTogether && contentIsIdentical && jinxFromDifferentPeople) {
                return jinx
            } else return;
            
        },
        respond: async ({message, testResult}) => {
            await message.channel.send(testResult).catch(e => console.error(e));
        }
    },
    periodictable: {
        check: ({message}) => {
            let content = message.content.toLowerCase()

            if (content.length > 973) return;                             //this checks if the message is empty or too long
            if (content.match(/[^a-zA-Z\s]/)) return;                      //this tests for non-alphabetical characters
            if (content.includes("j") || content.includes("q")) return;   //no j or q on the periodic table, fun fact

            if (content.length < 20) {return;};                           //only test strings with more than 20 characters, for coolness factor

            if (content.endsWith("x")) {return;}                          //another fun fact: x only starts a two-letter combo, so cannot end it
            const impossibleEndings = ["aa", "ad", "ae", "az", "bd", "bg", "bl", "bm", "bt", "bz", "cg", "ct", "cz", "da", "dd", "de", "dg", "dl", "dm", "dr", "dt", "dz", "ea", "ed", "ee", "eg", "el", "em", "et", "ez", "fa", "fd", "fg", "ft", "fz", "gg", "gl", "gm", "gr", "gt", "gz", "ha", "hd", "hl", "hm", "hr", "ht", "hz", "ia", "id", "ie", "ig", "il", "im", "it", "iz", "ka", "kd", "ke", "kg", "kl", "km", "kt", "kz", "ld", "le", "lg", "ll", "lm", "lt", "lz", "ma", "me", "ml", "mm", "mr", "mz", "ng", "nl", "nm", "nr", "nt", "nz", "oa", "od", "oe", "ol", "om", "or", "ot", "oz", "pe", "pg", "pl", "pz", "rd", "rl", "rm", "rr", "rt", "rz", "sa", "sd", "sl", "st", "sz", "td", "tg", "tr", "tt", "tz", "ua", "ud", "ue", "ug", "ul", "um", "ur", "ut", "uz", "va", "vd", "ve", "vg", "vl", "vm", "vr", "vt", "vz", "wa", "wd", "we", "wg", "wl", "wm", "wr", "wt", "wz", "xa", "xb", "xc", "xd", "xf", "xg", "xh", "xi", "xk", "xl", "xm", "xn", "xo", "xp", "xr", "xs", "xt", "xu", "xv", "xw", "xy", "xz", "ya", "yd", "ye", "yg", "yl", "ym", "yr", "yt", "yz", "za", "zb", "zc", "zd", "ze", "zf", "zg", "zh", "zi", "zk", "zl", "zm", "zo", "zp", "zs", "zt", "zu", "zv", "zw", "zy", "zz"]
            if (impossibleEndings.includes(content.slice(-2))) {return;}     //all of these also impossible endings to a message (btw i'm bothering to check the ending super well because it's going to take a while to get there with this algorithm, and figuring out which endings are impossible is relatively straightforward with another algoritm i made elsewhere. it's already super fast so i really don't have to do this, but i am bored on winter break and terrified to push this complicated update)

            const ones = ["h","b","c","n","o","f","p","s","k","v","y","i","w","u"]; 
            const twos = ["he","li","be","ne","na","mg","al","si","cl","ar","ca","sc","ti","cr","mn","fe","co","ni","cu","zn","ga","ge","as","se","br","kr","rb","sr","zr","nb","mo","tc","ru","rh","pd","ag","cd","in","sn","sb","te","xe","cs","ba","la","ce","pr","nd","pm","sm","eu","gd","tb","dy","ho","er","tm","yb","lu","hf","ta","re","os","ir","pt","au","hg","tl","pb","bi","po","at","rn","fr","ra","ac","th","pa","np","pu","am","cm","bk","cf","es","fm","md","no","lr","rf","db","sg","bh","hs","mt","ds","rg","cn","nh","fl","mc","lv","ts","og"];

            content = content.replaceAll(" ", "")

            function periodicCheck(array, index) {
                if (content.length <= index) return array

                let oneChar = content[index].toUpperCase()
                let twoChar = content[index].toUpperCase().concat(content[index + 1]?.toLowerCase())

                if (twos.includes(twoChar.toLowerCase()) && ones.includes(oneChar.toLowerCase())) { 
                    array.push(twoChar)

                    const twoCheck = periodicCheck([...array], index + 2)

                    if (twoCheck) return twoCheck; else {
                        array.pop(); array.push(oneChar);
                        return periodicCheck([...array], index + 1)
                    }

                } else if (twos.includes(twoChar.toLowerCase())) { 
                    array.push(twoChar)

                    return periodicCheck([...array], index + 2)
                } else if (ones.includes(oneChar.toLowerCase())) {
                    array.push(oneChar)
                    
                    return periodicCheck([...array], index + 1)
                }

                return null
            }

            const tableArray = periodicCheck([], 0)

            if (tableArray) return tableArray.join(" "); //must be true at this point
        },
        respond: async ({message, vars, testResult}) => {
            const randomFooter = footers.periodic[Math.floor(Math.random() * footers.periodic.length)];

            const periodicString = testResult
            
            if (await vars.db.get(`setting_notifs_${message.author.id}`) !== "log") { //other cases require a reply
                await message.reply(`:test_tube: Your message is on the periodic table! \n\`${periodicString}\``);
            }

            let notifchannel = false //by default, do not log
            await message.guild.channels.fetch(await vars.db.get(`setting_notif_channel_${message.guildId}`)).then(channel => {
                if (!(channel instanceof vars.Discord.Collection)) notifchannel = channel //for logged responses, overwrites default if found
            }) 
            
            if (notifchannel) {
                const ping = await vars.db.get(`setting_notifs_${message.author.id}`) == "log" ? `<@${message.author.id}>` : "" //only ping if no reply
                
                const periodicSplit = periodicString.match(/(.{1,1000})/g); //make sure we don't go over embed char limits
        
                const newEmbed = new EmbedBuilder().setColor(0x21c369)
                    .setTitle(`| :test_tube: | ${message.author.displayName}'s message`)
                    .setDescription(`is on the periodic table! Take a look:`)
                    .addFields({name: " ", value: " "})
                    .setURL(message.url)
                    .setFooter({text: randomFooter})
        
                    periodicSplit.forEach(str => { //embed char limits once again
                        newEmbed.addFields({name: " ", value: `\`${str}\``});
                    })
                    newEmbed.addFields({name: " ", value: " "});
        
                await notifchannel.send({content: ping, embeds: [newEmbed]}).catch(e => console.error(e)); //only send notif if there is a log channel
            }
        }
    }
}