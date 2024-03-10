const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js")

module.exports = {
    name: 'help',
    description: 'Returns commands for the bot and info about them. (you just used this)', //at least if they see this, they did
    async execute({message, args}, {client, prefix, db}) {
        const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) == "enable")

        const helpEmbed = createEmbed({message, args}, {client, prefix})

        if (classic) { message.tryreply({embeds: [helpEmbed]}); }
        else { modernMode({message, args}, {client, prefix}, helpEmbed)}
    }
}

const moreInfoCommands = {
    translate: (newEmbed, prefix) => {
        //translate codes redirect happened earlier
        newEmbed.setTitle('Translate Comamnd').addFields(
            {
                name: `${prefix}translate (source) (target) (sentence)`, 
                value: `Translate any sentence using Google Translate's API. \n\n Source/Target: A valid language code. Note that using \"auto\" in Source will idenfity the language automatically, but will do nothing in Target. \n\n Sentence: The sentence that's being translated. That's it. \n\n Remember to use ${prefix}translate codes (page) or ${prefix}help translate (page), with page being a letter A-Z, to view valid codes for supported languages. `
            })
    },
    maybepile: (newEmbed, prefix) => {
        newEmbed.setTitle('Maybepile Comamnd')
        .addFields(
            {name: `${prefix}maybepile view (page number)`, value: 'See the list of maybepile items, with titles, descriptions, and credits for each one. The default argument if not provided to the main command. \n\n Page number: Which page you want to view. Page 0 is the Table of Contents, with titles and credits for every item. Pages beyond that give lengthier descriptions for singular items. Defaults to 0 if not specified.'},
            {name: `${prefix}maybepile suggest/add (title)` , value: "Add an item to the Maybepile list. After the command is run, BirdBox will request a title and description in separate messages, before appending it to the list of future features. Note that only registered devs can add items to the list. \n\n Title: Title can optionally be provided early as an argument for the main command, which skips a step in setting up the full item."},
            {name: `${prefix}maybepile edit (page number) (item component)`, value: 'Edit an existing Maybepile item. Note that only registered devs can edit items. \n\n Page number: The page number of the item being edited. As the Table of Contents is special, 0 is invalid for this argument. \n\n Item component: Which part of the item is being edited. Title can be edited with "title" or "t," description with "description," "desc," or "d," and the credit can be modified with "author," "suggester," a," or "s." If nothing is provided, the component will be requested in a separate message.'},
            {name: `${prefix}maybepile delete (page number)`, value: 'Delete a Maybepile item; to be used if the item is discarded or successfully implemented. Note that only registered devs can delete items. \n\n Page number: The page number of the item being deleted. As the Table of Contents is special, 0 is invalid for this argument.'}
        )
    },
    pin: (newEmbed, prefix) => {
        newEmbed.setTitle('Pin Comamnd')
    .addFields(
        {name: `${prefix}pin`, value: 'The message replied to will be pinned to its respective channel. Note that (aside from devs) anybody can pin in default channels, but only the thread owner can pin in threads or forum posts.'}
    )
    },
    unpin: (newEmbed, prefix) => {
        newEmbed.setTitle('Pin Comamnd')
        .addFields(
            {name: `${prefix}unpin` , value: "The message replied to will be unpinned, if currently pinned. Note that (aside from devs) nobody can unpin in default channels, and only the thread owner can unpin in threads or forum posts."}
        )
    },
    responses: (newEmbed, prefix) => {
        newEmbed.setTitle('Responses Comamnd')
        .addFields(
            {name: `${prefix}responses message add (title)`, value: 'Add a single-message response with a list of potential keywords. When BirdBox sees one of the keywords, it will send the response as a reply to the message. \n\n Response: The response can optionally be provided early as an argument for the main command, which skips a step in setting up the full item.'},
            {name: `${prefix}responses message delete/remove (title)` , value: "Delete a single-message response. The response will be used for deletion, rather than any of its keywords, as it is a unique identifier. \n\n Response: The response can optionally be provided early as an argument for the main command, which skips a step in deleting the item."},
            {name: `${prefix}responses lyric add (title)`, value: 'Add a chain of responses. When BirdBox sees an item in the chain, it will send the next item if applicable. \n\n Title: The title can optionally be provided early as an argument for the main command, which skips a step in setting up the full item. Note that the title is useless apart from deletion.'},
            {name: `${prefix}responses delete (title)`, value: 'Delete a response chain using its title. \n\n Title: The title can optionally be provided early as an argument for the main command, which skips a step in deleting the item.'})
    },
    rps: (newEmbed, prefix) => {
        newEmbed.setTitle('Rock Paper Scissors Comamnd')
    .addFields(
        {name: `${prefix}rps (choice)`, value: "BirdBox will randomly generate a choice, and the result will be determined based on the rules of rock-paper-scissors. Winning or losing has no consequences, it's just for fun." + '\n\n Choice: Which item you are using in rock-paper-scissors. Can be "rock," "paper," or "scissors," with the abbreviations of "r," "p," and "s" also being acceptable.'})
    }
}

function createEmbed({message, args}, {client, prefix}) {
    let newEmbed = new EmbedBuilder()
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

    addCommandsToEmbed(client, prefix, basicEmbed)

    moreInfoCommands[args[0]]?.(newEmbed, prefix);

    if (newEmbed.data.title) {
        return newEmbed
    } else {
        return basicEmbed
    }
}

function createCommandList(client, prefix) {
    let commandList = JSON.parse(JSON.stringify(Array.from(client.commands.values()).filter(command => !command.hidden)));
    commandList.forEach(item => {
        if (moreInfoCommands[item.name]) item.name += " ★";
        item.name = prefix + item.name;
        item.value = item.description;
        item.inline = true;
    });

    return commandList
}

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
    const select = new StringSelectMenuBuilder()
    .setCustomId(`help`)
    .setPlaceholder(`Jump to ★ commands`)

    const commandList = createCommandList(client, prefix)

    commandList.forEach(command => {
        if (command.name.endsWith("★")) {
            select.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(command.name.replace(" ★", ""))
                    .setDescription(command.value)
                    .setValue(command.name.replace(" ★", "")))
    }})

    const selectMenu = new ActionRowBuilder().addComponents(select)

    return selectMenu
}
async function modernMode({message}, {client, prefix}, helpEmbed) {
    const selectMenu = createSelectMenuRow(client, prefix);

    sent = await message.reply({embeds: [helpEmbed], components: [selectMenu]}).catch(err => console.error(err))

    const interactcollector = sent.createMessageComponentCollector({ time: 30000 });

    interactcollector.on('collect', async i => {
        let newmessage = message; newmessage.content = i.values[0]
        let newargs = [].concat(message.content.slice(prefix.length).trim().toLowerCase().split(/ +/g).shift());

        const updatedEmbed = createEmbed({message: newmessage, args: newargs}, {client, prefix});
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