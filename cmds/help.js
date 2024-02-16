module.exports = {
    name: 'help',
    description: 'tells users what the bot is and what it can do',
    async execute(message, args, vars, Discord, sent /*part of the jank that is modern mode; should be null ususally*/) {
        const EmbedBuilder = vars.EmbedBuilder
        const prefix = vars.prefix

        const db = vars.db;

        const classic = Boolean(await db.get(`setting_classic_${message.author.id}`) == "enable")

        let newEmbed = new EmbedBuilder()
        .setColor(0xcbe1ec).setFooter({text: 'Made by TheBirdWasHere, with help from friends.'})
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})

        //why do i constantly take on projects that involve writing
        //i don't even like it that much
        //at least programming is cool, but still

        const basicEmbed = new EmbedBuilder()
        .setTitle('Commands and Info').setColor(0xcbe1ec)
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
        .setDescription(`Learn about this bot's capabilities. \n★ = ${prefix}help (command name) for more info.`)
        .addFields(
            {name: `${prefix}8ball`, value: 'Question the Box and never get a straight answer.', inline: true},
            {name: `${prefix}config` , value: "Change bot-related settings for the user and server.", inline: true},
            {name: `${prefix}credits` , value: "View the credits for this bot. It's pretty obvious what it does.", inline: true},
            {name: `${prefix}echo`, value: `Make the bot say dumb things. Use ${prefix}echo noreply for no message reply!`, inline: true},
            {name: `${prefix}help`, value: 'Returns commands for the bot and info about them. (you just used this)', inline: true},
            {name: `${prefix}info`, value: `Learn about the bot's latest updates. Use ${prefix}info full to see even more!`, inline: true},
            {name: `${prefix}maybepile ★`, value: 'Take a look at pending features that may or may not happen.', inline: true},
            {name: `${prefix}neofetch/netstats`, value: 'runs neofetch or ifconfig on the host server. (linux thingys)', inline: true},
            {name: `${prefix}pin/unpin ★` , value: 'Pin or unpin a message by replying to it. (why discord no make this perm)', inline: true},
            {name: `${prefix}ping`, value: 'Returns a pong if the bot is working. Useful to test if it crashed.', inline: true},
            {name: `${prefix}responses ★` , value: 'Manage bot sticker and lyric responses. Birdbox dev only!', inline: true},
            {name: `${prefix}rps ★` , value: 'Play rock paper scissors with the bot. Simple but fun!', inline: true},
            {name: `${prefix}rr`, value: 'Error command? Wait a minute. Is it an acronym? You find out.', inline: true},
            {name: `${prefix}snipe`, value: 'Fetch a recent deleted message! (does not work with images)', inline: true},
            {name: `${prefix}translate ★` , value: `Use Google Translate right from BirdBox! ${prefix}help translate for details.`, inline: true}
        ).setFooter({text: 'Made by TheBirdWasHere, with help from friends.'})

        //redirect to translatecodes.js
        if (args[0] == 'translate' && args[1]) { require(`./translatecodes`).execute(message, args, vars); return; };

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
        else { require("../modernmode").help(message, args, vars, basicEmbed, embed, sent); }
    }
}