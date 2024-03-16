const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('cats')
		.setDescription('Picks a random cat from TheCatAPI.')
    .addStringOption(option =>
			option
				.setName('type')
				.setDescription('What type of cat image you want.')
          .addChoices(
              { name: 'image', value: 'jpg' },
              { name: 'gif', value: 'gif' }
          )
        ),
    async execute(interaction, {embedColors}) {

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

    }
}