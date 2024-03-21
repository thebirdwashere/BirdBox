const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Grabs values from the database at request.')
        .addStringOption(option =>
			option
				.setName('item')
				.setDescription('Item that you want to grab from the database.')
                .setMaxLength(128)
				.setRequired(true)
        ),
    filter: ['host', 'developer'],
    async execute(interaction, {db}) {

        const item = interaction.options.getString('item');
        const database_item = await db.get(item);
        
        if (database_item) {
            let itemstring = JSON.stringify(database_item);
            itemstring = itemstring.match(/.{1,2000}/g);
            itemstring.forEach(element => { interaction.reply({ content: element, ephemeral: true }) });
        } else { interaction.reply({ content: `Failed to locate item: \`${item}\` in the database. Please try again.`, ephemeral: true }) };
    
    }
}