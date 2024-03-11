const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'rr',
    description: "Error command? Wait a minute. Is it an acronym? You find out.",
    execute({message}){

      //feast your eyes upon the glory of kek's (as of writing) singular contribution to birdbox project
      //this was created over about 5 minutes of tireless work and dedication, according to message logs
      //the tools for his masteful work? notepad++ and a healthy dose of copy-paste from the repo

      //in his own words: "lore accurate rick roll????" "i copied some cause i didnt really understna"
      //(https://discord.com/channels/1028140805732450334/1213902014753407099/1213908970423451688)
      //wise words from no doubt the wisest among us

      const rrEmbed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setTitle('Never Gonna Give You Up')
      .setAuthor({ name: 'Rick Astley', iconURL: 'https://i1.sndcdn.com/artworks-000222761718-he77qt-t500x500.jpg' })
      .setDescription("We\'re no strangers to love \nYou know the rules and so do I \nA full commitment\'s what I\'m thinking of \nYou wouldn\'t get this from any other guy \nI just wanna tell you how I\'m feeling \nGotta make you understand \n\nNever gonna give you up \nNever gonna let you down \nNever gonna run around and desert you \nNever gonna make you cry \nNever gonna say goodbye \nNever gonna tell a lie and hurt you \n\nWe\'ve known each other for so long \nYour heart\'s been aching but you\'re too shy to say it \nInside we both know what\'s been going on \nWe know the game and we\'re gonna play it \nAnd if you ask me how I\'m feeling \nDon\'t tell me you\'re too blind to see \n\nNever gonna give you up \nNever gonna let you down \nNever gonna run around and desert you \nNever gonna make you cry \nNever gonna say goodbye \nNever gonna tell a lie and hurt you")
      .setFooter({text: 'lol get rekt u been rick rolled, there you go, you happy now?!? please dont do that too much, it is literally spam city here now.'});

      message.reply({ embeds: [rrEmbed] });

    }
}
