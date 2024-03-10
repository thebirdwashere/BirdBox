const { EmbedBuilder } = require("discord.js");
const { hidden } = require("./translatecodes");

module.exports = {
    name: 'help',
    description: 'Returns commands for the bot and info about them. (you just used this)', //at least if they see this, they did
    async execute({message, args}, {client, prefix, db}, sent /*part of the jank that is modern mode; should be null ususally*/) {
        const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) == "enable")

        let newEmbed = new EmbedBuilder()
        .setColor(0xcbe1ec).setFooter({text: 'Made by TheBirdWasHere, with help from friends.'})
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})

        const basicEmbed = new EmbedBuilder()
        .setTitle('Commands and Info').setColor(0xcbe1ec)
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
        .setDescription(`Learn about this bot's capabilities. \n★ = ${prefix}help (command name) for more info.`)
        .setFooter({text: 'Made by TheBirdWasHere, with help from friends.'})

        let commandList = Array.from(client.commands.values());
        commandList = commandList.map(item => ({
            name: item.name,
            value: item.description,
            hidden: item.hidden,
            inline: true
        }));

        commandList.filter(command => !command.hidden)
        .forEach(command => {
            console.log(command)
            basicEmbed.addFields(command)})

        //redirect to translatecodes.js
        if (args[0] == 'translate' && args[1]) { require(`./translatecodes`).execute({message, args}, {prefix, db}); return; };

        if (args[0] == 'maybepile') {
            newEmbed.setTitle('Maybepile Comamnd')
            .addFields(
                {name: `${prefix}maybepile view (page number)`, value: 'See the list of maybepile items, with titles, descriptions, and credits for each one. The default argument if not provided to the main command. \n\n Page number: Which page you want to view. Page 0 is the Table of Contents, with titles and credits for every item. Pages beyond that give lengthier descriptions for singular items. Defaults to 0 if not specified.'},
                {name: `${prefix}maybepile suggest/add (title)` , value: "Add an item to the Maybepile list. After the command is run, BirdBox will request a title and description in separate messages, before appending it to the list of future features. Note that only registered devs can add items to the list. \n\n Title: Title can optionally be provided early as an argument for the main command, which skips a step in setting up the full item."},
                {name: `${prefix}maybepile edit (page number) (item component)`, value: 'Edit an existing Maybepile item. Note that only registered devs can edit items. \n\n Page number: The page number of the item being edited. As the Table of Contents is special, 0 is invalid for this argument. \n\n Item component: Which part of the item is being edited. Title can be edited with "title" or "t," description with "description," "desc," or "d," and the credit can be modified with "author," "suggester," a," or "s." If nothing is provided, the component will be requested in a separate message.'},
                {name: `${prefix}maybepile delete (page number)`, value: 'Delete a Maybepile item; to be used if the item is discarded or successfully implemented. Note that only registered devs can delete items. \n\n Page number: The page number of the item being deleted. As the Table of Contents is special, 0 is invalid for this argument.'}
            )
        };

        if (args[0] == 'pin' || args[0] == 'unpin' || args[0] == 'pin/unpin') {
            newEmbed.setTitle('Pin/Unpin Comamnd')
            .addFields(
                {name: `${prefix}pin`, value: 'The message replied to will be pinned to its respective channel. Note that anybody can pin in default channels, but only the thread owner can pin in threads or forum posts.'},
                {name: `${prefix}unpin` , value: "The message replied to will be unpineed, if currently pinned. Note that nobody can unpin in default channels, and only the thread owner can unpin in threads or forum posts."})
        };

        if (args[0] == 'responses') {
            newEmbed.setTitle('Responses Comamnd')
            .addFields(
                {name: `${prefix}responses message add (title)`, value: 'Add a single-message response with a list of potential keywords. When BirdBox sees one of the keywords, it will send the response as a reply to the message. \n\n Response: The response can optionally be provided early as an argument for the main command, which skips a step in setting up the full item.'},
                {name: `${prefix}responses message delete/remove (title)` , value: "Delete a single-message response. The response will be used for deletion, rather than any of its keywords, as it is a unique identifier. \n\n Response: The response can optionally be provided early as an argument for the main command, which skips a step in deleting the item."},
                {name: `${prefix}responses lyric add (title)`, value: 'Add a chain of responses. When Birdbox sees an item in the chain, it will send the next item if applicable. \n\n Title: The title can optionally be provided early as an argument for the main command, which skips a step in setting up the full item. Note that the title is useless apart from deletion.'},
                {name: `${prefix}responses delete (title)`, value: 'Delete a response chain using its title. \n\n Title: The title can optionally be provided early as an argument for the main command, which skips a step in deleting the item.'})
        };

        if (args[0] == 'rps') {
            newEmbed.setTitle('Rock Paper Scissors Comamnd')
            .addFields(
                {name: `${prefix}rps (choice)`, value: "Birdbox will randomly generate a choice, and the result will be determined based on the rules of rock-paper-scissors. Winning or losing has no consequences, it's just for fun." + '\n\n Choice: Which item you are using in rock-paper-scissors. Can be "rock," "paper," or "scissors," with the abbreviations of "r," "p," and "s" also being acceptable.'})
        };

        if (args[0] == 'translate') {
            newEmbed.setTitle('Translate Comamnd')
            .addFields(
                {name: `${prefix}translate (source) (target) (sentence)`, value: `Translate any sentence using Google Translate's API. \n\n Source/Target: A valid language code. Note that using \"auto\" in Source will idenfity the language automatically, but will do nothing in Target. \n\n Sentence: The sentence that's being translated. That's it. \n\n Remember to use ${prefix}translate codes (page) or ${prefix}help translate (page), with page being a letter A-Z, to view valid codes for supported languages. `})
        };

        let embed = basicEmbed
        if (newEmbed.data.title) {embed = newEmbed}

        if (classic) { message.tryreply({embeds: [embed]}); }
        else { require("../modernmode").help({message, args}, {prefix, db}, {basicEmbed, embed}, sent); }
    }
}