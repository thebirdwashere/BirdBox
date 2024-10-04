const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('image')
		.setDescription('Enjoy some images handpicked (randomly) by BirdBox.')
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
          .addStringOption(option =>
            option
              .setName('breed')
              .setDescription('What breed of cat you want images of.')
              .setAutocomplete(true)
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
          .addStringOption(option =>
            option
              .setName('breed')
              .setDescription('What breed of dog you want images of.')
              .setAutocomplete(true)
              )
    ),
    async autocomplete(interaction) {

      let petBreeds

      switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
        case 'cat': {
          await fetch(`https://api.thecatapi.com/v1/breeds`)
          .then(response => response.json())
          .then(json => {petBreeds = json})
          break;
        }
        
        case 'dog': {
          await fetch(`https://api.thedogapi.com/v1/breeds`)
          .then(response => response.json())
          .then(json => {petBreeds = json})
          break;
        }
      }

      const focusedOption = interaction.options.getFocused(true);
      const value = focusedOption.value.toLowerCase()
      let filtered = petBreeds.filter(breed => breed.name.toLowerCase().startsWith(value));
      filtered = filtered.map(breed => ({ name: breed.name, value: breed.id.toString() }));
      filtered = filtered.slice(0, 25);

      await interaction.respond(filtered);

  },
    async execute(interaction, {embedColors}) {

      const imageType = interaction.options?.getString('type') ?? 'jpg';
      const selectedBreed = interaction.options?.getString('breed') ?? '';

      switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
        case 'cat': {

          let fetchString = `https://api.thecatapi.com/v1/images/search?mime_types=${imageType}`

          if (selectedBreed) {
            fetchString += `&breed_ids=${selectedBreed}`
          }

          try {
            let catData; await fetch(fetchString)
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

          let fetchString = `https://api.thedogapi.com/v1/images/search?mime_types=${imageType}`

          if (selectedBreed) {
            fetchString += `&breed_ids=${selectedBreed}`
          }

          try {
            let dogData; await fetch(fetchString)
            .then(response => response.json())
            .then(json => {dogData = json})

            const dogEmbed = new EmbedBuilder()
              .setTitle(`Random Dog`)
              .setAuthor({ name: 'TheDogAPI', iconURL: 'https://i.natgeofe.com/n/225bafe4-88e7-4f91-ad60-7ff43277ec4b/Conan2_square.jpg' })
              .setColor(embedColors.blue)
              .setImage(dogData[0].url);

            await interaction.reply({ embeds: [dogEmbed] });
          } catch (error) { await interaction.reply({ content: `There was an error: \`${error}\`. This was most likely caused by a cooldown or timeout. Consider slowing down your request rate.`, ephemeral: true }); }
          break;
        }
      }
    },
    async executeClassic({message, args, content}, {prefix, embedColors}) {

      const imageType = args[1] || 'jpg';
      const selectedBreed = content.replace(`${args[0]}`, "").replace(`${args[1]}`, "").trim()

      switch (args[0]) { // Switch to handle different subcommands.
        case 'cat': {
          
          let fetchString = `https://api.thecatapi.com/v1/images/search?mime_types=${imageType}`

          if (selectedBreed) {
            let petBreeds; await fetch(`https://api.thecatapi.com/v1/breeds`)
            .then(response => response.json())
            .then(json => {petBreeds = json})

            const petIds = petBreeds.map(breed => breed.id)
            const petIdArray = petBreeds.map(breed => ({ [breed.name.toLowerCase()]: breed.id }))
            const petIdObj = Object.assign({}, ...petIdArray)

            let selectedBreedId
            if (petIds.includes(selectedBreed)) {
              selectedBreedId = selectedBreed
            } else {
              selectedBreedId = petIdObj[selectedBreed.toLowerCase()]
            }
            
            fetchString += `&breed_ids=${selectedBreedId}`
          }

          try {
            let catData; await fetch(fetchString)
            .then(response => response.json())
            .then(json => {catData = json})
    
            const catEmbed = new EmbedBuilder()
              .setTitle(`Random Cat`)
              .setAuthor({ name: 'TheCatAPI', iconURL: 'https://i.natgeofe.com/n/eb0f9db1-8b29-4598-ad7e-89716501189f/cat-whisperers-nationalgeographic_1048225_square.jpg' })
              .setColor(embedColors.blue)
              .setImage(catData[0].url);
    
            await message.reply({ embeds: [catEmbed] });
          } catch (error) { await message.reply({ content: `There was an error: \`${error}\`. This was most likely caused by a cooldown or timeout. Consider slowing down your request rate.` }); }
          break;
        }
        
        case 'dog': {
          try {
            let fetchString = `https://api.thedogapi.com/v1/images/search?mime_types=${imageType}`

            if (selectedBreed) {
              let petBreeds; await fetch(`https://api.thedogapi.com/v1/breeds`)
              .then(response => response.json())
              .then(json => {petBreeds = json})
  
              const petIds = petBreeds.map(breed => breed.id.toString())
              const petIdArray = petBreeds.map(breed => ({ [breed.name.toLowerCase()]: breed.id.toString() }))
              const petIdObj = Object.assign({}, ...petIdArray)
  
              let selectedBreedId
              if (petIds.includes(selectedBreed)) {
                selectedBreedId = selectedBreed
              } else {
                selectedBreedId = petIdObj[selectedBreed.toLowerCase()]
              }
              
              fetchString += `&breed_ids=${selectedBreedId}`
            }

            let dogData; await fetch(fetchString)
            .then(response => response.json())
            .then(json => {dogData = json})
    
            const dogEmbed = new EmbedBuilder()
              .setTitle(`Random Dog`)
              .setAuthor({ name: 'TheDogAPI', iconURL: 'https://i.natgeofe.com/n/225bafe4-88e7-4f91-ad60-7ff43277ec4b/Conan2_square.jpg' })
              .setColor(embedColors.blue)
              .setImage(dogData[0].url);
    
            await message.reply({ embeds: [dogEmbed] });
          } catch (error) { await message.reply({ content: `There was an error: \`${error}\`. This was most likely caused by a cooldown or timeout. Consider slowing down your request rate.` }); }
          break;
        }

        default: {
          await message.reply(`bruh idk what you want an image of, use ${prefix}image cat/dog to specify`);
          break;
        }
      }
    }
}