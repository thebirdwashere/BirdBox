const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js")

module.exports = {
    name: 'help',
    description: 'Returns commands for the bot and info about them. (you just used this)', //at least if they see this, they did
    async execute({message, args}, {client, prefix, db}) {
        //get classic variable (determines one thing just below)
        const classic = Boolean(await db.get(`settings.classic.${message.author.id}`) == "enable")

        //create the embed to be either sent or passed
        const helpEmbed = createEmbed({message, args}, {client, prefix})

        //either send embed or pass it to modernMode
        if (classic) { message.tryreply({embeds: [helpEmbed]}); }
        else { modernMode({message, args}, {client, prefix}, helpEmbed)}
    }
}

//used to create more specialized embeds
const moreInfoCommands = {
    translate: (moreInfoEmbed, prefix) => {
        //translate codes redirect happened earlier
        moreInfoEmbed.setTitle('Translate Comamnd').addFields(
            {
                name: `${prefix}translate (source) (target) (sentence)`, 
                value: `Translate any sentence using Google Translate's API. \n\n Source/Target: A valid language code. Note that using \"auto\" in Source will idenfity the language automatically, but will do nothing in Target. \n\n Sentence: The sentence that's being translated. That's it. \n\n Remember to use ${prefix}translate codes (page) or ${prefix}help translate (page), with page being a letter A-Z, to view valid codes for supported languages. `
            })
    },
    maybepile: (moreInfoEmbed, prefix) => {
        moreInfoEmbed.setTitle('Maybepile Comamnd')
        .addFields(
            {name: `${prefix}maybepile view (page number)`, value: 'See the list of maybepile items, with titles, descriptions, and credits for each one. The default argument if not provided to the main command. \n\n Page number: Which page you want to view. Page 0 is the Table of Contents, with titles and credits for every item. Pages beyond that give lengthier descriptions for singular items. Defaults to 0 if not specified.'},
            {name: `${prefix}maybepile suggest/add (title)` , value: "Add an item to the Maybepile list. After the command is run, BirdBox will request a title and description in separate messages, before appending it to the list of future features. Note that only registered devs can add items to the list. \n\n Title: Title can optionally be provided early as an argument for the main command, which skips a step in setting up the full item."},
            {name: `${prefix}maybepile edit (page number) (item component)`, value: 'Edit an existing Maybepile item. Note that only registered devs can edit items. \n\n Page number: The page number of the item being edited. As the Table of Contents is special, 0 is invalid for this argument. \n\n Item component: Which part of the item is being edited. Title can be edited with "title" or "t," description with "description," "desc," or "d," and the credit can be modified with "author," "suggester," a," or "s." If nothing is provided, the component will be requested in a separate message.'},
            {name: `${prefix}maybepile delete (page number)`, value: 'Delete a Maybepile item; to be used if the item is discarded or successfully implemented. Note that only registered devs can delete items. \n\n Page number: The page number of the item being deleted. As the Table of Contents is special, 0 is invalid for this argument.'}
        )
    },
    pin: (moreInfoEmbed, prefix) => {
        moreInfoEmbed.setTitle('Pin Comamnd')
    .addFields(
        {name: `${prefix}pin`, value: 'The message replied to will be pinned to its respective channel. By default, anybody can pin in default channels, but only the thread owner can pin in threads or forum posts. This can be changed in the config, however!'}
    )
    },
    unpin: (moreInfoEmbed, prefix) => {
        moreInfoEmbed.setTitle('Pin Comamnd')
        .addFields(
            {name: `${prefix}unpin` , value: "The message replied to will be unpinned, if currently pinned. By default, nobody can unpin in default channels, and only the thread owner can unpin in threads or forum posts. This can be changed in the config, however!"}
        )
    },
    responses: (moreInfoEmbed, prefix) => {
        moreInfoEmbed.setTitle('Responses Comamnd')
        .addFields(
            {name: `${prefix}responses message add (title)`, value: 'Add a single-message response with a list of potential keywords. When BirdBox sees one of the keywords, it will send the response as a reply to the message. \n\n Response: The response can optionally be provided early as an argument for the main command, which skips a step in setting up the full item.'},
            {name: `${prefix}responses message delete/remove (title)` , value: "Delete a single-message response. The response will be used for deletion, rather than any of its keywords, as it is a unique identifier. \n\n Response: The response can optionally be provided early as an argument for the main command, which skips a step in deleting the item."},
            {name: `${prefix}responses lyric add (title)`, value: 'Add a chain of responses. When BirdBox sees an item in the chain, it will send the next item if applicable. \n\n Title: The title can optionally be provided early as an argument for the main command, which skips a step in setting up the full item. Note that the title is useless apart from deletion.'},
            {name: `${prefix}responses delete (title)`, value: 'Delete a response chain using its title. \n\n Title: The title can optionally be provided early as an argument for the main command, which skips a step in deleting the item.'})
    },
    rps: (moreInfoEmbed, prefix) => {
        moreInfoEmbed.setTitle('Rock Paper Scissors Comamnd')
    .addFields(
        {name: `${prefix}rps (choice)`, value: "BirdBox will randomly generate a choice, and the result will be determined based on the rules of rock-paper-scissors. Winning or losing has no consequences, it's just for fun." + '\n\n Choice: Which item you are using in rock-paper-scissors. Can be "rock," "paper," or "scissors," with the abbreviations of "r," "p," and "s" also being acceptable.'})
    }
}

//create the embed (used in modernmode and the main execute)
function createEmbed({message, args}, {client, prefix}) {
    let moreInfoEmbed = new EmbedBuilder()
    .setColor(0xcbe1ec).setFooter({text: 'Made by TheBirdWasHere, with help from friends.'})
    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})

    const basicEmbed = new EmbedBuilder()
    .setTitle('Commands and Info').setColor(0xcbe1ec)
    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
    .setDescription(`Learn about this bot's capabilities. \n★ = ${prefix}help (command name) for more info.`)
    .setFooter({text: 'Made by TheBirdWasHere, with help from friends.'})
    
    if (args[0] == "translate" && args[1]) {
        //redirect to translatecodes.js
        require(`./translatecodes`).execute({message, args}); return; 
    }

    //add the commands to the embed
    addCommandsToEmbed(client, prefix, basicEmbed)

    //if there's an associated entry in the commands with more info list, run the function and return that embed instead of the basic one
    if (moreInfoCommands[args[0]]?.(moreInfoEmbed, prefix)) {
        return moreInfoEmbed
    } else {
        return basicEmbed
    }
}

//create the commands list (this is complicated and that's the only reason it's separate)
function createCommandList(client, prefix) {
    //the json parsing here makes a deep copy which prevents issues with running this twice (it's jank but i didnt want polyfills)
    let commandList = JSON.parse(JSON.stringify(Array.from(client.commands.values()).filter(command => !command.hidden)));

    //this sets it up to be used for embeds
    commandList.forEach(item => {
        if (moreInfoCommands[item.name]) item.name += " ★";
        item.name = prefix + item.name;
        item.value = item.description;
        item.inline = true;
    });

    return commandList
}

//gets a command list and adds it to the embed
function addCommandsToEmbed(client, prefix, basicEmbed) {
    const commandList = createCommandList(client, prefix)
    commandList.forEach(command => {
        basicEmbed.addFields(command)})
}


/*/
 * -------------------------------
 * modern mode functions are below
 * -------------------------------
/*/

function createSelectMenuRow(client, prefix) {
    //basic select menu setup
    const select = new StringSelectMenuBuilder()
    .setCustomId(`help`)
    .setPlaceholder(`Jump to ★ commands`)

    //grab a command list for adding to select menu
    const commandList = createCommandList(client, prefix)

    //if it has a star (meaning it has an extra info page), add to selector minus the star
    commandList.forEach(command => {
        if (command.name.endsWith("★")) {
            select.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(command.name.replace(" ★", ""))
                    .setDescription(command.value)
                    .setValue(command.name.replace(" ★", "")))
    }})

    //make this a row and return the row
    const selectMenu = new ActionRowBuilder().addComponents(select)

    return selectMenu
}

async function modernMode({message}, {client, prefix}, helpEmbed) {
    //grab the select menu
    const selectMenu = createSelectMenuRow(client, prefix);

    //send the message with the select menu
    sent = await message.tryreply({embeds: [helpEmbed], components: [selectMenu]});

    //create update collector
    const interactcollector = sent.createMessageComponentCollector({ time: 30000 });
    
    interactcollector.on('collect', async i => {
        //create new stuff to provide based on what command was desired
        let newmessage = message; newmessage.content = i.values[0]
        let newargs = [].concat(message.content.slice(prefix.length).trim().toLowerCase().split(/ +/g).shift());

        //get a new embed
        const updatedEmbed = createEmbed({message: newmessage, args: newargs}, {client, prefix});

        //disable the select menu and update the message
        selectMenu.components[0].setDisabled(true)
        sent.edit({embeds: [updatedEmbed], components: [selectMenu]})
        i.deferUpdate();
    });

    interactcollector.on('end', () => {
        //disable the selector
        selectMenu.components[0].setDisabled(true)
        sent.edit({components: [selectMenu]})
    });
}