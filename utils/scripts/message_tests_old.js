const { EmbedBuilder } = require("discord.js");

module.exports = {
    keywords: async (db, string, guild, messages, lyrics) => { //function for message/lyric responses
        let val = ""
        string = string.replace(/[^\w\s]/gi, "");
        if(messages) {
            for (const key in messages) {
                const regex = new RegExp(`(?:^|\\s)${key.toLowerCase()}(?:\\s|$)`); //chatgpt promised this would work, and it did, somehow
                if (regex.test(string) && (!val || key.length > val.length)) {
                    val = messages[key]
                }
            }
        }
        if(lyrics) {
            let expected = await db.get(`lyric_${guild}`);
            if (expected && string.includes(expected[0]) && lyrics[expected[1]].content[expected[2] + 1]) {
                await db.set(`lyric_${guild}`, [lyrics[expected[1]].content[expected[2] + 2], expected[1], expected[2] + 2]); //does not run when used as true/false test, cause it broke stuff
                return lyrics[expected[1]].content[expected[2] + 1];
            }
            for (let i = 0; i < lyrics.length; i++) {
                for (let j = lyrics[i].content.length - 1; j--;) {
                    if (string.includes(lyrics[i].content[j].toLowerCase()) /*&& (!val || lyrics[i].content[j].length >= val.length)*/) {
                        val = lyrics[i].content[j + 1]
                        await db.set(`lyric_${guild}`, [lyrics[i].content[j + 2], i, j + 2]);
                    }
                }
            }
        }
        return val;
    },
   
    alphabetical: (content) => { //alphabetical order checker
        if (content.length > 1935) {return;} //this checks if the message too long for embeds
        const splitcontent = content
            .replace(/[^a-zA-Z:\s]/g, "")      //remove all but letters, colons, and whitespace
            .split(" ")                        //split at space into an array
            .filter(word => word !== "")       //remove empty items from the array (in the case of double spaces)
            .filter(word => word[0] !== ":");  //remove words starting with colons from the array (in the case of emojis)

        if (splitcontent.length < 5) {return;} //only check messages longer than 5 words (because it's lame otherwise)
        
        const splitcontent_sorted = [...splitcontent].sort();

        if (splitcontent.join(" ") === splitcontent_sorted.join(" ")) { 
            return splitcontent.map(word => {return word[0].toUpperCase() + word.substring(1)})} //bolden each first letter
        else return;
    },

    jinx: (message, jinx) => { //jinx checker
        if (!jinx) {return;}

        //the required tests
        const jinxCreatedCloseTogether = Math.abs(jinx.timestamp - message.createdTimestamp) <= 2000
        const contentIsIdentical = jinx.content == message.content
        let jinxFromDifferentPeople = jinx.author !== message.author.id

        //only pass if all true
        return (jinxCreatedCloseTogether && contentIsIdentical && jinxFromDifferentPeople)
    },

    periodictable: (content) => {
        if (content.length > 973) {return;};                             //this checks if the message is empty or too long
        if (!/[^0-9\u{0080}-\u{FFFF}\p{M}]+/u.test(content)) {return;};  //this tests for non-latin characters and numbers
        if (content.includes("j") || content.includes("q")) {return;}    //no j or q on the periodic table, fun fact

        let newcontent = content.replace(/[^a-z]/gu, "");                //regex to remove everything but a-z (credit to chatgpt for both regexes)
        if (!newcontent[20]) {return;};                                  //only test strings with more than 20 letters, for coolness factor

        if (newcontent.endsWith("x")) {return;}                          //another fun fact: x only starts a two-letter combo, so cannot end it
        const impossibleEndings = ["aa", "ad", "ae", "az", "bd", "bg", "bl", "bm", "bt", "bz", "cg", "ct", "cz", "da", "dd", "de", "dg", "dl", "dm", "dr", "dt", "dz", "ea", "ed", "ee", "eg", "el", "em", "et", "ez", "fa", "fd", "fg", "ft", "fz", "gg", "gl", "gm", "gr", "gt", "gz", "ha", "hd", "hl", "hm", "hr", "ht", "hz", "ia", "id", "ie", "ig", "il", "im", "it", "iz", "ka", "kd", "ke", "kg", "kl", "km", "kt", "kz", "ld", "le", "lg", "ll", "lm", "lt", "lz", "ma", "me", "ml", "mm", "mr", "mz", "ng", "nl", "nm", "nr", "nt", "nz", "oa", "od", "oe", "ol", "om", "or", "ot", "oz", "pe", "pg", "pl", "pz", "rd", "rl", "rm", "rr", "rt", "rz", "sa", "sd", "sl", "st", "sz", "td", "tg", "tr", "tt", "tz", "ua", "ud", "ue", "ug", "ul", "um", "ur", "ut", "uz", "va", "vd", "ve", "vg", "vl", "vm", "vr", "vt", "vz", "wa", "wd", "we", "wg", "wl", "wm", "wr", "wt", "wz", "xa", "xb", "xc", "xd", "xf", "xg", "xh", "xi", "xk", "xl", "xm", "xn", "xo", "xp", "xr", "xs", "xt", "xu", "xv", "xw", "xy", "xz", "ya", "yd", "ye", "yg", "yl", "ym", "yr", "yt", "yz", "za", "zb", "zc", "zd", "ze", "zf", "zg", "zh", "zi", "zk", "zl", "zm", "zo", "zp", "zs", "zt", "zu", "zv", "zw", "zy", "zz"]
        if (impossibleEndings.includes(content.slice(-2))) {return;}     //all of these also impossible endings to a message (btw i'm bothering to check the ending super well because it's going to take a while to get there with this algorithm, and figuring out which endings are impossible is relatively straightforward with another algoritm i made elsewhere. it's already super fast so i really don't have to do this, but i am bored on winter break and terrified to push this complicated update)

        const ones = ["h","b","c","n","o","f","p","s","k","v","y","i","w","u"]; 
        const twos = ["he","li","be","ne","na","mg","al","si","cl","ar","ca","sc","ti","cr","mn","fe","co","ni","cu","zn","ga","ge","as","se","br","kr","rb","sr","zr","nb","mo","tc","ru","rh","pd","ag","cd","in","sn","sb","te","xe","cs","ba","la","ce","pr","nd","pm","sm","eu","gd","tb","dy","ho","er","tm","yb","lu","hf","ta","re","os","ir","pt","au","hg","tl","pb","bi","po","at","rn","fr","ra","ac","th","pa","np","pu","am","cm","bk","cf","es","fm","md","no","lr","rf","db","sg","bh","hs","mt","ds","rg","cn","nh","fl","mc","lv","ts","og"];

        //Ca Nb Ag !E!
        //Ca N Ba Ge

        let tablearray = [];
        let backtrackarray = [];
        let currentlyBacktracked = false; //explanation later for backtracking

        for (let i = 0; i < newcontent.length; i++) {
            if (newcontent[i + 1] && twos.includes(newcontent[i] + newcontent[i + 1]) && !currentlyBacktracked) { //two-letter names
                if (ones.includes(newcontent[i])) {backtrackarray.push([i, tablearray.length])} //for later backtracking if the two-element doesn't work

                tablearray.push(newcontent[i].toUpperCase() + newcontent[i + 1]);
                //console.log("string updated: " + tablearray)
                i++; /*increment one to not duplicate a letter*/

            } else if (ones.includes(newcontent[i])) { //one-letter names
                tablearray.push(newcontent[i].toUpperCase());
                //console.log("string updated: " + tablearray)
                currentlyBacktracked = false;
            }

            /*/ 
             * explanation of why we need backtracking: consider the case of "can be"
             * the algorithm will register Ca, Nb, and stop because E is not an element
             * there's a solution, but it prioiritizes two-letter names and never tries Ca N Be
             * backtracking makes it consider one-letter names (such as N over Nb) before quitting
             * 
             * BUT WAIT, future matty coming in with a new revelation: now consider "can brag"
             * once again it gets stuck (at G), but this time needs to go back 2 elements to unstuck
             * previously i just had a boolean and went back exactly one element,
             * now i'm adding an array of potential locations to check before quitting
            /*/ 

            else if (!currentlyBacktracked && backtrackarray[0]) {
                //console.log("didn't work, backtracking")
                backtrack_point = backtrackarray.pop()
                i = backtrack_point[0] - 1; currentlyBacktracked = true;
                tablearray = tablearray.slice(0, backtrack_point[1]); 
            } else {
                //console.log("returning, no valid symbols found")
                return;
            }
        }

        return tablearray.join(" "); //must be true at this point
    },

    responsetemplate: async (message, db, footers, reply, emoji, desc, color, content) => {
        if (await db.get(`setting_notifs_${message.author.id}`) !== "log") { //other cases require a reply
            message.tryreply(reply);}

        footers.push(
            `did you do that on purpose? no way this one was accidental.`,
            `it's beautiful, i've stared at it for ten hours now`)
            
        let ping = ""
        if (await db.get(`setting_notifs_${message.author.id}`) == "log") {ping = `<@${message.author.id}>`} //only ping if no reply

        const content_split = content.match(/(.{1,1000})/g); //make sure we don't go over embed char limits

        const newEmbed = new EmbedBuilder().setColor(color)
            .setTitle(`| ${emoji} | ${message.author.displayName}'s message`)
            .setDescription(`${desc} Take a look:`)
            .addFields({name: " ", value: " "})
            .setURL(message.url)
            .setFooter({text: randomChoice(footers)})

        content_split.forEach(str => {
            newEmbed.addFields({name: " ", value: `\`${str}\``});}) //embed char limits once again
        newEmbed.addFields({name: " ", value: " "});

        return {content: ping, embeds: [newEmbed]}
    },

    detection: async ({message, content}, {db, Discord}, tests) => {
        let notifchannel = false //by default, do not log
        await message.guild.channels.fetch(await db.get(`setting_notif_channel_${message.guildId}`)).then(channel => {
            if (!(channel instanceof Discord.Collection)) {notifchannel = channel}}) //for logged responses, overwrites default if found
    
        const alphabeticalness = tests.alphabetical(content)
        if (alphabeticalness) { //alphabetical order checker
            const randomWord = randomChoice(alphabeticalness)
            const randomFooter = [
                `now i know my abc's, next time won't you sing with me`,
                `perfectly sorted, as all things should be`,
                `remember kids, ${randomWord[0].toUpperCase()} is for "${randomWord}"`]
            
            let isItTechnical
            if (alphabeticalness.every( (val, i, arr) => val === arr[0] )) { //this test if every item is the same
                isItTechnical = "technical"
            } else {
                isItTechnical = "perfect"
            }
            const alpha_joined = alphabeticalness.join(" ");
            
            const notif = await tests.responsetemplate(message, db, randomFooter, 
                `:capital_abcd: Your message is in ${isItTechnical} alphabetical order! \n\`${alpha_joined}\``, 
                `:capital_abcd:`, `is in ${isItTechnical} alphabetical order!`, 
                0x3b88c3, alpha_joined)
            if (notifchannel) {await notifchannel.trysend(notif)} //only send notif if there is a log channel
        }
    
        const jinxDetectionEnabled = (await db.get(`setting_jinxes_${message.guildId}`) !== "disable")
    
        if (jinxDetectionEnabled) {
            const jinx = await db.get(`jinxes.${message.channelId}`) //jinx detector
            if (tests.jinx(message, jinx)) { message.channel.trysend(jinx.content) }
        }
    
        const periodicness = tests.periodictable(content)
        if (periodicness) { //periodic table checker
            const randomFooter = [
                `${message.author.username} nye the science guy fr`,
                `i wonder if this is a real compound, probably not but still`,
                `one could say, this only happens... periodically`]
            
                const notif = await tests.responsetemplate(message, db, randomFooter, 
                `:test_tube: Your message is on the periodic table! \n\`${periodicness}\``, 
                `:test_tube:`, `is on the periodic table!`, 
                0x21c369, periodicness)
                if (notifchannel) {await notifchannel.trysend(notif)} //only send notif if there is a log channel
        }
    
        if (jinxDetectionEnabled) {
            const oldJinxFormat = await db.get(`jinx_${message.channelId}`)
            if (oldJinxFormat) {
                await db.delete(`jinx_${message.channelId}`) //remove jinxes in the old format to clean up the db
            }

            //new format: changed to use dot notation and make an object of jinxes
            await db.set(`jinxes.${message.channelId}`, { 
                content: message.content, //for jinx detection
                author: message.author.id,
                timestamp: message.createdTimestamp
            })
        };
    }
}