const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ChannelSelectMenuBuilder, ChannelType } = require("discord.js")

async function newButtonModal(message, row, modal, {devs}) {
    //create the message with the button (variable declared for button disabling)
    const sent = await message.tryreply({ components: [row] }).catch(console.error);
    
    //collector for the button responses
    const buttoncollector = sent.createMessageComponentCollector({ time: 15000 });

    buttoncollector.on('collect', async i => {
        if (!devs.includes(i.member.id)) { return; } //filters out non-devs
        //show the popup
        await i.showModal(modal).catch(console.error);

        //disable the button
        row.components[0].setDisabled(true)
        await i.editReply({ components: [row] })
    });

    buttoncollector.on('end', () => {
        //disable the button
        row.components[0].setDisabled(true)
        sent.edit({ components: [row] })
    });
}

module.exports = {
    modalHandler: ({client, db}) => {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit()) {return;}
            switch (interaction.customId) {
                case "responses-add-message": {
                    let messageArray = await db.get('messages')
                    console.table(messageArray)
        
                    if (!messageArray) {
                        const defaultMessageArray = {};
                        await db.set('messages', defaultMessageArray); //default array if nothing is present
                        messageArray = defaultMessageArray
                    }
                    
                    let keystring = interaction.fields.getTextInputValue('message-keywords')
                    let response = interaction.fields.getTextInputValue('message-response')
                    
                    let keys = keystring.split(",").map(str => str.trim());
        
                    let failed = false
                    keys.forEach((item) => { 
                        if (messageArray[keystring]) {interaction.channel.trysend(`Error: please use a different keyword. \nOne of these keywords is already in use for this response: ${messageArray[keystring]}`); failed = true;}
                        messageArray[item.trim()] = response;
                    })
        
                    //confirm/error to user
                    if (failed) {return;} 
                    else if (!(response && keystring)) {
                        interaction.channel.trysend("Response has failed to add, please try again. Make sure you provided both a response and some keywords."); 
                        return;
                    } else { interaction.channel.trysend(`${response} added successfully!`); }
        
                    db.set('messages', messageArray)
                    console.table(messageArray)
                break;} case "responses-add-lyric": {
                    let lyricArray = await db.get('lyrics')
                    console.table(lyricArray)
        
                    if (!lyricArray) {
                        const defaultlyricArray = [];
                        await db.set('lyrics', defaultlyricArray); //default array if nothing is present
                        lyricArray = defaultlyricArray
                    }
        
                    let lyric = {title: interaction.fields.getTextInputValue('lyric-title').trim(), content: []}
        
                    for (let i = 0; i < lyricArray.length; i++) {
                        if (lyric.title == lyricArray[i].title) {
                            interaction.channel.trysend("already used that title, try a different one");
                            return;
                        }
                    }
                    
                    lyric.content = interaction.fields.getTextInputValue('lyric-lyrics').split("\n")
        
                    console.table(lyric.content)
                    lyricArray[lyricArray.length] = lyric
        
                    await db.set('lyrics', lyricArray)
        
                    interaction.channel.trysend(`${lyric.title} has successfully been added!`);
                    
                break;} case "maybepile-add": {
                    let maybeArray = await db.get("maybepile");

                    maybeArray[maybeArray.length] = {author: interaction.fields.getTextInputValue('maybepile-author'), title: interaction.fields.getTextInputValue('maybepile-title'), desc: interaction.fields.getTextInputValue('maybepile-desc')}
                    await db.set("maybepile", maybeArray);
                    interaction.channel.trysend(`${maybeArray[maybeArray.length - 1].title} has successfully been added!`);
                break;} case "maybepile-edit": {
                    let maybeArray = await db.get("maybepile");

                    const selectedMessage = interaction.fields.getTextInputValue('maybepile-page')

                    if (selectedMessage == 0) {
                        //aborts edit because the user chose table of contents
                        interaction.channel.trysend("sorry, you can't edit the table of contents"); return; }
                    if (!maybeArray[selectedMessage]) {
                        //aborts edit because nothing at the selection
                        interaction.channel.trysend(`can't find anything at index ${selectedMessage}`); return; }
                        
                    maybeArray[selectedMessage] = {author: interaction.fields.getTextInputValue('maybepile-author'), title: interaction.fields.getTextInputValue('maybepile-title'), desc: interaction.fields.getTextInputValue('maybepile-desc')}
                    await db.set("maybepile", maybeArray);
                    interaction.channel.trysend(`${maybeArray[selectedMessage].title} has successfully been edited!`);
                break;}
            }
            interaction.deferUpdate();
        });
    },

    responses_add_message: ({message, args}, {devs, prefix}) => {
        let response = message.content.replace(`${prefix}responses ${args[0]} ${args[1]}`, "")

        newButtonModal(message,
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Add a response')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId("responses-add-message")
                    .setDisabled(false)
            ),
            new ModalBuilder().setCustomId("responses-add-message").setTitle("Add Message Response")
            .addComponents([new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('message-response')
                        .setLabel(`Message`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`The response that Birdbox will provide.`)
                        .setValue(response)
                        .setRequired(true)),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('message-keywords')
                        .setLabel('Keywords')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder(`The words to prompt Birdbox to respond. Separate keywords with commas, not spaces.`)
                        .setRequired(true))]), {devs})},
    responses_add_lyric: ({message, args}, {devs, prefix}) => {
        let response = message.content.replace(`${prefix}responses ${args[0]} ${args[1]}`, "")

        newButtonModal(message,
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Add a response')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId("responses-add-message")
                    .setDisabled(false)
            ),
            new ModalBuilder().setCustomId("responses-add-lyric").setTitle("Add Lyric Response")
            .addComponents([new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('lyric-title')
                        .setLabel(`Title`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Title of the lyric response, for deletion purposes.`)
                        .setValue(response)
                        .setRequired(true)),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('lyric-lyrics')
                        .setLabel('Lyrics')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder(`The series of responses Birdbox should use. Separate lyrics with linebreaks, \nlike this.`)
                        .setRequired(true))]), {devs})},
    maybepile_add: ({message, args}, {prefix, devs}) => {
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
                        .setRequired(true))]), {devs})},
    maybepile_edit: async ({message, args}, {devs, db}) => {
        const maybeArray = await db.get("maybepile")
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
                        .setRequired(true))]), {devs})},
    maybepile_view: async ({message, args}, {prefix, devs, db}, embed, sent) => {

        if (embed[0].data.description !== "Take a look at and suggest potential features!") { //this indicates table of contents
            if (sent) { sent.edit({ embeds: embed }); }
            else {sent = await message.tryreply({ embeds: embed });}
            return;}

        const rowArray = [];
        let itemNum = 1

        embed.forEach(item => {
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
        
        //edit if this was sent already, otherwise send
        if (sent) { sent.edit({ embeds: embed }); }
        else {sent = await message.tryreply({ components: rowArray, embeds: embed });}

        //collector for the selector responses
        const selectcollector = sent.createMessageComponentCollector({ time: 15000 });

        selectcollector.on('collect', async i => {
            message.content = `${prefix}maybepile view ${i.values[0]}`;                 //so over here, because i had no better ideas, we bootstrap paradox ourselves into running maybepile again
            args = message.content.slice(prefix.length).trim().split(/ +/g).splice(1);  //with new message and args. then it sends it back, where we can edit our inital message with the recived content.            
            require('./cmds/maybepile').execute({message, args}, {prefix, devs, db}, "", sent);            //this is so janky. if anyone other than me comes in to edit this i owe them a heartfelt apology. 
            rowArray.forEach(item => {item.components[0].setDisabled(true)})
            sent.edit({ components: rowArray }); i.deferUpdate().catch(err => {console.error(err)});
        });

        selectcollector.on('end', () => {
            //disable the selector
            rowArray.forEach(item => {item.components[0].setDisabled(true)})
            sent.edit({ components: rowArray })});},
    help: async ({message, args}, {prefix, db}, {basicEmbed, embed}, sent) => {
        const select = new StringSelectMenuBuilder()
            .setCustomId(`help`)
            .setPlaceholder(`Jump to ★ commands`)

        basicEmbed.data.fields.forEach(command => {
            if (command.name.endsWith("★")) {
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(command.name.replace(" ★", ""))
                        .setDescription(command.value)
                        .setValue(command.name.replace(" ★", "")))
        }})
        
        let row = []
        if (basicEmbed == embed) { row[0] = new ActionRowBuilder().addComponents(select) }

        if (sent) { 
            await sent.edit({embeds: [embed], components: []})
        } else { sent = await message.tryreply({embeds: [embed], components: row}) }

        const interactcollector = sent.createMessageComponentCollector({ time: 30000 });
        interactcollector.on('collect', async i => {
            let newmessage = message; newmessage.content = i.values[0]
            let newargs = [].concat(message.content.slice(prefix.length).trim().toLowerCase().split(/ +/g).shift());

            require("./cmds/help").execute({message: newmessage, args: newargs}, {prefix, db}, sent);
            i.deferUpdate();                  //this physically pains me to do, but it's the only way this runs and i'm tired of debugging.
        });                                   //i just want to push this update. i've done practically nothing but this all weekend. send help. -matty, 8:29 pm, 1/21/2024 (21/01/2024 for the brits)

        interactcollector.on('end', () => {
            //disable the selector
            sent.edit({ components: [] })
        });
    }
}