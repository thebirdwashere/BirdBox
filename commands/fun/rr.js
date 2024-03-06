const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rr')
        .setDescription('funny'),
    async execute(interaction, {embedColors}) {

        const rrEmbed = new EmbedBuilder()
            .setColor(embedColors.white)
            .setTitle('Never Gonna Give You Up')
            .setAuthor({ name: 'Rick Astley', iconURL: 'https://i1.sndcdn.com/artworks-000222761718-he77qt-t500x500.jpg' })
            .setDescription("We\'re no strangers to love \nYou know the rules and so do I \nA full commitment\'s what I\'m thinking of \nYou wouldn\'t get this from any other guy \nI just wanna tell you how I\'m feeling \nGotta make you understand \n\nNever gonna give you up \nNever gonna let you down \nNever gonna run around and desert you \nNever gonna make you cry \nNever gonna say goodbye \nNever gonna tell a lie and hurt you \n\nWe\'ve known each other for so long \nYour heart\'s been aching but you\'re too shy to say it \nInside we both know what\'s been going on \nWe know the game and we\'re gonna play it \nAnd if you ask me how I\'m feeling \nDon\'t tell me you\'re too blind to see \n\nNever gonna give you up \nNever gonna let you down \nNever gonna run around and desert you \nNever gonna make you cry \nNever gonna say goodbye \nNever gonna tell a lie and hurt you")
            .setFooter({text: 'lol get rekt u been rick rolled, there you go, you happy now?!? please dont do that too much, it is literally spam city here now.'});

        await interaction.reply({ embeds: [rrEmbed] });

    }
}