const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('image')
		.setDescription('Picks a random image for your enjoyment.')
    .addSubcommand(subcommand =>
      subcommand
          .setName('cat')
          .setDescription('Picks a random cat from TheCatAPI.')
          .addStringOption(option =>
            option
              .setName('type')
              .setDescription('What type of cat image you want.')
                .addChoices(
                    { name: 'image', value: 'jpg' },
                    { name: 'gif', value: 'gif' }
                )
              )
    )
    .addSubcommand(subcommand =>
      subcommand
          .setName('dog')
          .setDescription('Picks a random dog from TheDogAPI.')
          .addStringOption(option =>
            option
              .setName('type')
              .setDescription('What type of dog image you want.')
                .addChoices(
                    { name: 'image', value: 'jpg' },
                    { name: 'gif', value: 'gif' }
                )
              )
    ),
    async execute(interaction, {embedColors}) {

      switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
        case 'cat': {

          const imageType = interaction.options?.getString('type') ?? 'jpg';

          try {
            let catData; await fetch(`https://api.thecatapi.com/v1/images/search?mime_types=${imageType}`)
            .then(response => response.json())
            .then(json => {catData = json})

            const catEmbed = new EmbedBuilder()
              .setTitle(`Random Cat`)
              .setAuthor({ name: 'TheCatAPI', iconURL: 'https://i.natgeofe.com/n/eb0f9db1-8b29-4598-ad7e-89716501189f/cat-whisperers-nationalgeographic_1048225_square.jpg' })
              .setColor(embedColors.blue)
              .setImage(catData[0].url);

            await interaction.reply({ embeds: [catEmbed] });
          } catch (error) { await interaction.reply({ content: `There was an error: \`${error}\`. This was most likely caused by a cooldown or timeout. Consider slowing down your request rate.`, ephemeral: true }); }
          break;
        }
        
        case 'dog': {

          const imageType = interaction.options?.getString('type') ?? 'jpg';

          try {
            let dogData; await fetch(`https://api.thedogapi.com/v1/images/search?mime_types=${imageType}`)
            .then(response => response.json())
            .then(json => {dogData = json})

            const dogEmbed = new EmbedBuilder()
              .setTitle(`Random Dog`)
              .setAuthor({ name: 'TheDogAPI', iconURL: 'https://i.natgeofe.com/n/eb0f9db1-8b29-4598-ad7e-89716501189f/cat-whisperers-nationalgeographic_1048225_square.jpg' })
              .setColor(embedColors.blue)
              .setImage(dogData[0].url);

            await interaction.reply({ embeds: [dogEmbed] });
          } catch (error) { await interaction.reply({ content: `There was an error: \`${error}\`. This was most likely caused by a cooldown or timeout. Consider slowing down your request rate.`, ephemeral: true }); console.log(error); }
          break;
        }
      }
    },
    async executeClassic({message, args}, {embedColors}) {

      const imageType = args[0] || 'jpg';

      try {
        let catData; await fetch(`https://api.thecatapi.com/v1/images/search?mime_types=${imageType}`)
        .then(response => response.json())
        .then(json => {catData = json})

        const catEmbed = new EmbedBuilder()
          .setTitle(`Random Cat`)
          .setAuthor({ name: 'TheCatAPI', iconURL: 'https://i.natgeofe.com/n/eb0f9db1-8b29-4598-ad7e-89716501189f/cat-whisperers-nationalgeographic_1048225_square.jpg' })
          .setColor(embedColors.blue)
          .setImage(catData[0].url);

        await message.reply({ embeds: [catEmbed] });
      } catch (error) { await message.reply({ content: `There was an error: \`${error}\`. This was most likely caused by a cooldown or timeout. Consider slowing down your request rate.` }); }
    }
}