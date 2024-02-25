/* TITLE: Maybe Pile Command
 * AUTHORS: Matty
 * DESCRIPTION: Take a look at and suggest potential features! */

const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'maybepile',
    description: 'Take a look at and suggest potential features!',
    async execute({message, args}, {prefix, devs, db}, sent /*part of the jank that is modern mode; should be null ususally*/) {
        const action = args[0]; //can be view, suggest, delete, or edit
        const filter = m => m.author.id == message.author.id //used in message awaits; just doing as stackoverflow guy says

        let embedArray = []; //used to fix overflow
        let maybeArray = await db.get('maybepile') 

        const defaultArray = ["table of contents"]

        const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) == "enable")

        //console.table(maybeArray)

        if (!maybeArray) {
            await db.set('maybepile', defaultArray); //default array if nothing is present
            maybeArray = defaultArray
        }
        
        function createEmbed(j) {
            embedArray[j] = new EmbedBuilder()
            .setColor('#208ddd')
        }

        if (action == "suggest" || action == "add") { //e;maybepile suggest
            if (!classic) { require("../modernmode").maybepile_add({message, args}, {prefix, devs, db}); return; } //redirect in case of modern mode

            //define array and get author
            const suggestion = {author: message.author.username};
            const title = message.content.replace(`${prefix}maybepile ${action}`, "")

            //title
            if (!title) {
            message.channel.trysend("Enter the title you want for your new suggestion.");
            await message.channel.awaitMessages({filter, max: 1, time: 300_000,/* five minute timer */ errors: ['time']}).then(collected => {
                suggestion.title = collected.first().content
            }).catch(console.error)}
            else {suggestion.title = title.trim()}

            //description
            message.channel.trysend("Enter the description you want for your new suggestion.");           
            await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                suggestion.desc  = collected.first().content
            }).catch(console.error)

            //confirm/error to user
            if (!(suggestion.author && suggestion.title && suggestion.desc)) {
                message.channel.trysend("Suggestion has failed to add, please try again. Make sure you provided both a title and description."); 
                return;
            }

            //add to original array
            maybeArray[maybeArray.length] = suggestion
            message.channel.trysend(`${maybeArray[maybeArray.length - 1].title} has successfully been added!`);
            
        } else if (action == "delete") { //e;maybepile delete (page number)
            let selectedMessage = args[1];
            console.log(maybeArray)

            if (!selectedMessage) 
                //aborts delete because no selection
                {message.channel.trysend(`bruh, i need something to delete. please use the format ${prefix}maybepile delete (item number)`); return;}
            if (!maybeArray[selectedMessage]) {
                //aborts delete because nothing at the selection
                message.channel.trysend(`can't find anything at index ${selectedMessage}`); return; }
            if (selectedMessage == 0) {
                //aborts delete because the user chose table of contents
                message.channel.trysend("bruh, you can't delete the table of contents"); return; }
            if (!devs.includes(message.author.id)) {
                //aborts delete because user does not have perms to delete
                message.channel.trysend("sorry, you must be a dev to delete something"); return;}

            message.channel.trysend(`Are you SURE you want to delete suggestion ${maybeArray[selectedMessage].title}?`);    
            message.channel.trysend('Confirm with "y" in the next ten seconds.');    
            //await the user confirming with "y" or "Y"
            await message.channel.awaitMessages({filter, max: 1, time: 10_000,/* ten second timer */ errors: ['time']}).then(collected => {
                if (collected.first().content.toUpperCase() == "Y") {
                    maybeArray.splice(selectedMessage, 1);
                    message.channel.trysend("Delete successful!");
                } else {
                    message.channel.trysend("Suggestion delete averted.");
                }
            }).catch(() => {message.channel.trysend("Suggestion delete averted.");})

        } else if (action == "edit") { //e;maybepile edit (page number) title/t/desc/description/d/suggester/s/author/a
            let selectedMessage = args[1];
            let selectedSection = args[2];

            const titleResponses = ["title", "t"]
            const descResponses = ["description", "desc", "d"]
            const authorResponses = ["suggester", "author", "s", "a"]

            if (!selectedMessage) {
                //aborts edit because no selection
                message.channel.trysend(`bruh, i need something to edit. please use the format ${prefix}maybepile edit (item number) title/description`); return; }
            if (selectedMessage == 0) {
                //aborts edit because the user chose table of contents
                message.channel.trysend("sorry, you can't edit the table of contents"); return; }
            if (!maybeArray[selectedMessage] && classic) {
                //aborts edit because nothing at the selection
                message.channel.trysend(`can't find anything at index ${selectedMessage}`); return; }
            if (!devs.includes(message.author.id) && maybeArray[selectedMessage].author !== message.author.username) {
                //aborts edit because user does not have perms to edit
                message.channel.trysend("sorry, you must be a dev or the original poster to edit something"); return;}
            
            if (!classic) { require("../modernmode").maybepile_edit({message, args}, {prefix, devs, db}); return; } //redirect in case of modern mode
            
            if (!selectedSection) {
                message.channel.trysend("Are you editing the title, description, or author?");
                await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                    if (collected.first().content) {selectedSection = collected.first().content.trim()} //set the response message as the selection
                })}

            if (titleResponses.includes(selectedSection)) {
                message.channel.trysend(`Please type your new title for ${maybeArray[selectedMessage].title}.`);

                //it took me literal hours to figure out i need await here
                //it's not documented as needing it anywhere i saw
                //so glad i fixed it f i n a l l y
                //this message comes to you from matty at almost 10 pm, 21st of nov 2023

                await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                    maybeArray[selectedMessage].title = collected.first().content.trim() //set the response message as the title
                    message.channel.trysend(`Done! "${maybeArray[selectedMessage].title}" is now our new title.`);   
                })
            } else if (descResponses.includes(selectedSection)) {
                message.channel.trysend(`Please type your new description for ${maybeArray[selectedMessage].title}.`);   

                await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                    maybeArray[selectedMessage].desc = collected.first().content.trim() //set the response message as the description
                    message.channel.trysend(`Done! "${maybeArray[selectedMessage].desc}" is now our new description.`);   
                    
                })
            } else if (authorResponses.includes(selectedSection)) {
                message.channel.trysend(`Please type your new suggestion author for ${maybeArray[selectedMessage].title}.`);   

                await message.channel.awaitMessages({filter, max: 1, time: 600_000,/* ten minute timer */ errors: ['time']}).then(collected => {
                    maybeArray[selectedMessage].author = collected.first().content.trim() //set the response message as the author
                    message.channel.trysend(`Done! "${maybeArray[selectedMessage].author}" is now our new author.`);   
                    
                })
            } else {
                message.channel.trysend("you can edit the title, description, or author. try one of those lol");
            }
        } else if (action == "view" || !action || !isNaN(Number(action))) { //e;maybepile view (page number)
                let pageNum
    
                if (isNaN(Number(action))) {
                    pageNum = args[1];
                } else {
                    pageNum = Number(args[0]);
                }
    
                if (pageNum == 0 || !pageNum) { //table of contents
                    let i = 1 
                    let j = 0 //they're special tools that will help us later
    
                    createEmbed(j)
                    embedArray[j]
                    .setColor('#208ddd')
                    .setTitle('The Maybe Pile')
                    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
                    .setDescription('Take a look at and suggest potential features!')
                    .setFooter({text: 'Page 0 ● Also a bot that doesn\'t run on spaghetti code.'})
                    .setThumbnail('https://cdn.discordapp.com/attachments/826968641790017576/906737704581079070/iu.png')
                    
                    //failsafe that i have no doubt will somehow happen at some point
                    if (!maybeArray[1] && maybeArray.toString() !== defaultArray.toString() /*i despise javascript equality*/ ) {try {embedArray[0].addFields({name: "maybepile data appears to be corrupted, contact a dev asap", value: " "})} catch {console.error};} 
                    else if (!maybeArray[1]) {try {embedArray[0].addFields({name: "huh, looks like there's nothing here", value: " "})} catch {console.error};}
                    //chatgpt did this one
                    else { maybeArray.slice(1).forEach((item) => {
                        if (i % 25 == 0) { //in the case of i being any number that is some multiple of 25 (they overflow the embed if 26, i reduced slightly for cleaner inline)
                            embedArray[j].setFooter({text: ' '})
                            j++; createEmbed(j)
                        }
                        try {embedArray[j].addFields({name: `${i}: ${item.title}`, value: `Suggested by ${item.author}`, inline: true})} catch {console.error};
                        i++
                    });}
                    if (classic) {message.channel.trysend({embeds: embedArray});}
                    else { require("../modernmode").maybepile_view({message, args}, {prefix, devs, db}, embedArray, sent); } //redirect in case of modern mode}
                } else {
                    if (!maybeArray[pageNum]) {message.channel.trysend(`can't find anything at index ${pageNum}`); return; }
                    //specific maybepile item
                    const newEmbed = new EmbedBuilder()
                    .setColor('#208ddd')
                    .setTitle('The Maybe Pile')
                    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
                    .setFooter({text: `Page ${pageNum} ● Suggested by ${maybeArray[pageNum].author}, special thanks to them!`})
                    .setThumbnail('https://cdn.discordapp.com/attachments/826968641790017576/906737704581079070/iu.png');
                    try {newEmbed.addFields({name: maybeArray[pageNum].title, value: maybeArray[pageNum].desc})} catch {console.error};

                    if (classic) {message.channel.trysend({embeds: [newEmbed]});}
                    else { require("../modernmode").maybepile_view({message, args}, {devs, db}, [newEmbed], sent); } //redirect in case of modern mode
                    
                }
        } else if (action) {
            message.channel.trysend(`please use ${prefix}maybepile view/suggest/edit/delete cause idk what "${action}" is`);   
        } else {
            message.channel.trysend(`please use ${prefix}maybepile view/suggest/edit/delete cause idk what "" is`);   
        }

        //console.log("array modified, new arrray:")
        //console.table(maybeArray)

        await db.set('maybepile', maybeArray)
    }
}