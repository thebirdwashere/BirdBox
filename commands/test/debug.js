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
                .addStringOption(option => option.setName('command').setDescription('The command to check the permissions of.').setRequired(true).setAutocomplete(true))
        ),
    filter: {
        'database': ['host', 'developer'],
        'permissions': ['host', 'developer']
    },
    async autocomplete(interaction, {commands}) {

        const choices = commands.map(item => item.data.name);

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.charAt(0).toUpperCase() + focusedOption.value.slice(1).toLowerCase()
        let filtered = choices.filter(choice => choice.startsWith(value));
        filtered = filtered.map(choice => ({ name: choice, value: choice }));
        filtered = filtered.slice(0, 25);

        await interaction.respond(filtered);

    },
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
    
    },
    async executeClassic({ message, args }, {db, commands}) {

        switch (args[0]) { // Switch to handle different subcommands.
            case 'database': {

                const item = args[1];
                const database_item = await db.get(item);
                
                if (database_item) {
                    let itemstring = JSON.stringify(database_item);
                    itemstring = itemstring.match(/.{1,2000}/g);
                    itemstring.forEach(element => { message.reply(`Value: ${element}`) });
                } else { message.reply(`Failed to locate item: \`${item}\` in the database. Please try again.`) };

            } break;

            case 'permissions': {

                const command = args[1];
                if (!commands.map(item => item.data.name).includes(command)) return message.reply('The specified command does not exist. Please try again.');

                const commandPerms = Object.fromEntries( commands.map(item => item.data.name).map((key, index) => [key, commands.map(item => item.filter)[index]]) );

                if (!commandPerms[command]) return message.reply(`Valid permission levels of \`/${command}\`: \`(any)\``);
                message.reply(`Valid permission levels of \`/${command}\`: ${commandPerms[command].map(item => `\`${item}\``).join(', ')}`);

            } break;

            default: {

                message.reply('available subcommands are `database` and `permissions`');

            } break;
        }
    
    }
}