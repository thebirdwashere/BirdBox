/* TITLE: Maybe Pile Command
 * AUTHORS: Matty
 * DESCRIPTION: Take a look at and suggest potential features! */

const { ModalBuilder, ButtonBuilder, ButtonStyle,  EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { newButtonModal } = require("../modernmode")

module.exports = {
    name: 'maybepile',
    description: 'Take a look at pending features that may or may not happen.',
    async execute({message, args}, {prefix, devs, db}, sent /*part of the jank that is modern mode; should be null ususally*/) {
        const action = args[0]; //can be view, suggest, delete, or edit
        const filter = m => m.author.id == message.author.id //used in message awaits; just doing as stackoverflow guy says

        let embedArray = []; //used to fix overflow with embeds
        let maybeArray = await db.get('maybepile') 

        const defaultArray = ["table of contents"]

        const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) == "enable")

        //console.table(maybeArray)

        if (!maybeArray) {
            await db.set('maybepile', defaultArray); //default array if nothing is present
            maybeArray = defaultArray
        }

        if (action == "suggest" || action == "add") { //e;maybepile suggest
            if (!classic) { modernModeAdd({message, args}, {prefix, devs}); return; } //redirect in case of modern mode

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
            
            if (!classic) { modernModeEdit({message, args}, {devs}, maybeArray); return; } //redirect in case of modern mode to create button and modal
            
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
                embedArray = createTableOfCOntents(embedArray, maybeArray, defaultArray)
                if (classic) {message.channel.trysend({embeds: embedArray});}
                else { modernModeView(message, embedArray, maybeArray) } //redirect in case of modern mode
            } else {
                //getting a specific maybepile item
                if (!maybeArray[pageNum]) {message.channel.trysend(`can't find anything at index ${pageNum}`); return; }

                //get item embed
                const itemEmbed = createSpecificItemEmbed(maybeArray, pageNum);

                //send item embed (no need to redirect to modernmode here, is ok if the selector only appears on table of contents)
                message.channel.trysend({embeds: [itemEmbed]});
                
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

/*/
 * --------------------------------
 * classic mode functions are below
 * --------------------------------
/*/

function initializeEmbed(j, embedArray) {
    embedArray[j] = new EmbedBuilder()
    .setColor('#208ddd')
}

function createTableOfCOntents(embedArray, maybeArray, defaultArray) {
    let i = 1 //incrementor for looping through maybepile items and adding to embeds
    let j = 0 //incrementor for the embeds themselves

    //create the first embed
    initializeEmbed(j, embedArray)
    embedArray[j]
    .setTitle('The Maybe Pile')
    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
    .setDescription('Take a look at and suggest potential features!')
    .setFooter({text: 'Page 0 ● Also a bot that doesn\'t run on spaghetti code.'})
    .setThumbnail('https://cdn.discordapp.com/attachments/826968641790017576/906737704581079070/iu.png')
    
    //failsafe that i have no doubt will somehow happen at some point
    if (!maybeArray[1] && maybeArray.toString() !== defaultArray.toString() /*i despise javascript equality*/ ) {try {embedArray[0].addFields({name: "maybepile data appears to be corrupted, contact a dev asap", value: " "})} catch {err => console.error(err)};} 
    else if (!maybeArray[1]) {try {embedArray[0].addFields({name: "huh, looks like there's nothing here", value: " "})} catch {err => console.error(err)};}

    //chatgpt did this one
    else { maybeArray.slice(1).forEach((item) => {
        if (i % 25 == 0) { //in the case of i being any number that is some multiple of 25 (they overflow the embed if 26, i reduced slightly for cleaner inline)
            embedArray[j].setFooter({text: ' '}); //blank out the footer so its not weird looking
            j++; initializeEmbed(j, embedArray);  //new embed and continue loop
        }
        try {embedArray[j].addFields({name: `${i}: ${item.title}`, value: `Suggested by ${item.author}`, inline: true})} catch {err => console.error(err)};
        i++;
    });}

    return embedArray
}

function createSpecificItemEmbed(maybeArray, pageNum) {
    const itemEmbed = new EmbedBuilder()
    .setColor('#208ddd')
    .setTitle('The Maybe Pile')
    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
    .setFooter({text: `Page ${pageNum} ● Suggested by ${maybeArray[pageNum].author}, special thanks to them!`})
    .setThumbnail('https://cdn.discordapp.com/attachments/826968641790017576/906737704581079070/iu.png');
    try {itemEmbed.addFields({name: maybeArray[pageNum].title, value: maybeArray[pageNum].desc})} catch {console.error};

    return itemEmbed
}

/*/
 * -------------------------------
 * modern mode functions are below
 * -------------------------------
/*/

async function modernModeView(message, embedArray, maybeArray) {
    const rowArray = [];
    let itemNum = 1

    embedArray.forEach(item => {
        const options = new StringSelectMenuBuilder()
        .setCustomId(`maybepile-view-${itemNum}`)
        .setPlaceholder(`Jump to item (embed ${itemNum})`)
        for (let i = 0; i < item.data.fields.length; i++) { //iterate through embed fields to grab data
            options.addOptions(
                new StringSelectMenuOptionBuilder()
                .setLabel(item.data.fields[i].name)
                .setDescription(item.data.fields[i].value)
                .setValue(item.data.fields[i].name.split(":")[0].toString())
            )
        }
        rowArray.push(new ActionRowBuilder().addComponents(options)); itemNum++;
    })
    
    const sent = await message.tryreply({ components: rowArray, embeds: embedArray });

    //collector for the selector responses
    const selectcollector = sent.createMessageComponentCollector({ time: 15000 });

    selectcollector.on('collect', async i => {
        //get a new embed for the selected item
        const updatedEmbed = createSpecificItemEmbed(maybeArray, i.values[0])

        //disable selectors and edit message with update
        rowArray.forEach(item => {item.components[0].setDisabled(true)})
        sent.edit({ embeds: [updatedEmbed], components: rowArray });
        i.deferUpdate();
    });

    selectcollector.on('end', () => {
        //disable the selector
        rowArray.forEach(item => {item.components[0].setDisabled(true)})
        sent.edit({ components: rowArray })});
}

async function modernModeEdit({message, args}, {devs}, maybeArray) {
    const item = maybeArray[args[1]]

    newButtonModal(message,
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Edit an item')
                .setStyle(ButtonStyle.Primary)
                .setCustomId("maybepile-edit")
                .setDisabled(false)
        ),
        new ModalBuilder().setCustomId("maybepile-edit").setTitle("Edit Maybepile Item")
        .addComponents([new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('maybepile-title')
                    .setLabel(`Title`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Title of the item.`)
                    .setValue(item.title)
                    .setRequired(true)),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('maybepile-desc')
                    .setLabel('Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder(`The description of the item, displayed on the item's page.`)
                    .setValue(item.desc)
                    .setRequired(true)),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('maybepile-author')
                    .setLabel(`Suggester`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Person who suggested this item to be added. Credit where it's due!`)
                    .setValue(item.author)
                    .setRequired(true)),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('maybepile-page')
                    .setLabel(`Page`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Which page is being modified.`)
                    .setValue(args[1])
                    .setRequired(true))]), {devs})
}

async function modernModeAdd({message, args}, {prefix, devs}) {
    const suggester = message.author.username
    const title = message.content.replace(`${prefix}maybepile ${args[0]}`, "").trim()

    newButtonModal(message,
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Add an item')
                .setStyle(ButtonStyle.Primary)
                .setCustomId("maybepile-add")
                .setDisabled(false)
        ),
        new ModalBuilder().setCustomId("maybepile-add").setTitle("Add Maybepile Item")
        .addComponents([new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('maybepile-title')
                    .setLabel(`Title`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Title of the item.`)
                    .setValue(title)
                    .setRequired(true)),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('maybepile-desc')
                    .setLabel('Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder(`The description of the item, displayed on the item's page.`)
                    .setRequired(true)),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('maybepile-author')
                    .setLabel(`Suggester`)
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Whoever suggested this item. Credit where it's due!`)
                    .setValue(suggester)
                    .setRequired(true))]), {devs}
    )
}