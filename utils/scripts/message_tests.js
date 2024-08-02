module.exports = {
    keywords: {
        check: async ({message, db}) => { //function for message/lyric responses
            const messageArray = await db.get("messages")
            const lyricArray = await db.get("lyrics")
            const guild = message.guildId

            let val = ""
            content = message.content.toLowerCase().replace(/[^\w\s]/gi, "");

            if(messageArray) {
                for (const key in messageArray) {
                    const regex = new RegExp(`(?:^|\\s)${key.toLowerCase()}(?:\\s|$)`); //chatgpt promised this would work, and it did, somehow
                    if (regex.test(content) && (!val || key.length > val.length)) {
                        val = messageArray[key]
                    }
                }
            }
            if(lyricArray) {
                let expected = await db.get(`lyric_${guild}`);
                if (expected && content.includes(expected[0]) && lyricArray[expected[1]].content[expected[2] + 1]) {
                    await db.set(`lyric_${guild}`, [lyricArray[expected[1]].content[expected[2] + 2], expected[1], expected[2] + 2]); //does not run when used as true/false test, cause it broke stuff
                    return lyricArray[expected[1]].content[expected[2] + 1];
                }
                for (let i = 0; i < lyricArray.length; i++) {
                    for (let j = lyricArray[i].content.length - 1; j--;) {
                        if (content.includes(lyricArray[i].content[j].toLowerCase()) /*&& (!val || lyricArray[i].content[j].length >= val.length)*/) {
                            val = lyricArray[i].content[j + 1]
                            await db.set(`lyric_${guild}`, [lyricArray[i].content[j + 2], i, j + 2]);
                        }
                    }
                }
            }
            return val;
        },
        respond: undefined
    },
   
    alphabetical: {
        check: ({message}) => { //alphabetical order checker
            const content = message.content.toLowerCase()

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
        respond: undefined
    },

    jinx: {
        check: async ({message, db}) => { //jinx checker
            const jinx = await db.get(`jinx_${message.channelId}`)
            if (!jinx) {return;}

            //the required tests
            const jinxCreatedCloseTogether = Math.abs(jinx.timestamp - message.createdTimestamp) <= 2000
            const contentIsIdentical = jinx.content == message.content
            let jinxFromDifferentPeople = jinx.author !== message.author.id

            //only pass if all true
            return (jinxCreatedCloseTogether && contentIsIdentical && jinxFromDifferentPeople)
        },
        respond: undefined
    },
    periodictable: {
        check: ({message}) => {
            const content = message.content.toLowerCase()

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
                * there's a solution, but it prioritizes two-letter names and never tries Ca N Be
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
        respond: undefined
    }
}