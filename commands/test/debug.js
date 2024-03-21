const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Various debug functions for BirdBox developers.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('database')
                .setDescription('Grabs values from the database at request.')
                .addStringOption(option => option.setName('item').setDescription('Item that you want to grab from the database.').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('permissions')
                .setDescription('Checks the permissions of a command.')
                .addStringOption(option => option.setName('command').setDescription('The command to check the permissions of.').setRequired(true))
        ),
    filter: ['host', 'developer'],
    async execute(interaction, {db, commands}) {

        switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
            case 'database': {

                const item = interaction.options?.getString('item');
                const database_item = await db.get(item);
                
                if (database_item) {
                    let itemstring = JSON.stringify(database_item);
                    itemstring = itemstring.match(/.{1,2000}/g);
                    itemstring.forEach(element => { interaction.reply({ content: `Value: ${element}`, ephemeral: true }) });
                } else { interaction.reply({ content: `Failed to locate item: \`${item}\` in the database. Please try again.`, ephemeral: true }) };

            } break;

            case 'permissions': {

                const command = interaction.options?.getString('command');
                if (!commands.map(item => item.data.name).includes(command)) return interaction.reply({ content: 'The specified command does not exist. Please try again.', ephemeral: true });

                const commandPerms = Object.fromEntries( commands.map(item => item.data.name).map((key, index) => [key, commands.map(item => item.filter)[index]]) );

                if (!commandPerms[command]) return interaction.reply({ content: `Valid permission levels of \`/${command}\`: \`(any)\``, ephemeral: true });
                interaction.reply({ content: `Valid permission levels of \`/${command}\`: ${commandPerms[command].map(item => `\`${item}\``).join(', ')}`, ephemeral: true });

            } break;
        }
    
    }
}