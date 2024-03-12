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
    newButtonModal: newButtonModal,
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
    }
}