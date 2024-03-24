const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require("discord.js");
const translate = require('google-translate-api-x');
const { langs } = require('../../utils/json/langs.json');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('translate')
		.setDescription('Uses the Google Translate API to convert text.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('codes')
                .setDescription('Shows a list of language codes in alphabetical order.')
                .addStringOption(option => option.setName('char').setDescription('Character to jump to.').setMaxLength(1))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Uses the Google Translate API to convert text.')
                .addStringOption(option =>
                    option
                        .setName('from')
                        .setDescription('Language to translate from')
                        .setMaxLength(24)
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName('to')
                        .setDescription('Language to translate to')
                        .setMaxLength(24)
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('Message to translate')
                        .setMaxLength(1024)
                        .setRequired(true)
                )
        ),
    async autocomplete(interaction) {

        const choices = langs.map(item => item.name);

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.charAt(0).toUpperCase() + focusedOption.value.slice(1)
        let filtered = choices.filter(choice => choice.startsWith(value));
        filtered = filtered.map(choice => ({ name: choice, value: choice }));
        filtered = filtered.slice(0, 25);

        await interaction.respond(filtered);

    },
    async execute(interaction, {embedColors}) {

        switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
            case 'codes': {

                const char = interaction.options?.getString('char') ?? 'a';

                function updateEmbed(char) {
                    let filteredLangs = [];

                    langs.forEach((item) => {
                        if (item.name.toLowerCase().startsWith(char)) { filteredLangs.push(item); }
                    });

                    const translateEmbed = new EmbedBuilder()
                        .setColor(embedColors.white)
                        .setTitle('Translate Codes')
                        .setDescription(`Results for: "${char}"`)
                        .setFooter({ text: 'Special thanks to users like you!' });

                    filteredLangs.forEach((item) => { translateEmbed.addFields({ name: item.name, value: item.value }) });
                    if(filteredLangs.length == 0) translateEmbed.addFields({ name: ' ', value: 'No results found.' });

                    return [translateEmbed];
                }

                function updateRow() {
                    const charList = 'abdefghijklmnprstuvwxyz'.split('');          
                    const charSelect = new StringSelectMenuBuilder()
                        .setCustomId('charSelect')
                        .setPlaceholder('Page to jump to...');

                    charList.forEach((item) => {
                        charSelect.addOptions([
                            new StringSelectMenuOptionBuilder()
                                .setLabel(item)
                                .setValue(item)
                        ]);
                    });
                    
                    const infoSelectRow = new ActionRowBuilder()
                        .addComponents(charSelect);

                    return [infoSelectRow];
                }

                const response = await interaction.reply({ embeds: updateEmbed(char), components: updateRow() });
                const filter = (i) => i.user.id === interaction.user.id;

                const selectCollector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000, filter });

                selectCollector.on('collect', async (interaction) => {
                    const char = interaction.values[0];
                    await interaction.message.edit({ embeds: updateEmbed(char), components: updateRow() });
                    await interaction.deferUpdate();
                });

            } break;

            case 'message': {

                let translateFrom = interaction.options.getString('from');
                let translateTo = interaction.options.getString('to');
                const rawMessage = interaction.options.getString('text');

                const codesArray = langs.map(item => item.value);
                const namesArray = langs.map(item => item.name);

                if(codesArray.includes(translateFrom)) translateFrom = namesArray[codesArray.indexOf(translateFrom)]; // Converts input lang codes to full names
                if(codesArray.includes(translateTo)) translateTo = namesArray[codesArray.indexOf(translateTo)];

                if(namesArray.includes(translateFrom.charAt(0).toUpperCase() + translateFrom.slice(1))) translateFrom = translateFrom.charAt(0).toUpperCase() + translateFrom.slice(1); // Checks if full input lang names are uppercased
                if(namesArray.includes(translateTo.charAt(0).toUpperCase() + translateTo.slice(1))) translateTo = translateTo.charAt(0).toUpperCase() + translateTo.slice(1);

                translate(rawMessage, { from: translateFrom, to: translateTo }).then(res => {

                    const translateEmbed = new EmbedBuilder()
                        .setColor(embedColors.blue)
                        .setTitle('Translation Output')
                        .setAuthor({ name: 'Google Translate', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/1024px-Google_Translate_logo.svg.png' })
                        .addFields(
                            { name: translateFrom, value: rawMessage, inline: true },
                            { name: translateTo, value: res.text, inline: true }
                        )
                        .setFooter({ text: 'Powered by the Google Translate API!' });

                    interaction.reply({ embeds: [translateEmbed] });

                }).catch((error) => {

                    console.log(error);
                    interaction.reply({ content: 'You have either entered an invalid language code/name or broke the command in some other way. Consult the help command for more information on how to use this command.', ephemeral: true });
                    return;

                });
            } break;
        }
    },
    async executeClassic({message, args}, {embedColors, prefix}){
        if (args[0] == "codes") { 
            const lettersList = 'abcdefghijklmnopqrstuvwxyz'.split('');
            const charList = 'abdefghijklmnprstuvwxyz'.split('');
            const requestedPage = args[1].toLowerCase()

            if (!requestedPage) {
                message.reply(`use ${prefix}translate codes A-Z to go to a page`).catch(e => console.error(e));
                return; 
            } else if (!lettersList.includes(requestedPage)) {
                message.reply(`${requestedPage} isn't a letter bruh, use ${prefix}translate codes A-Z`).catch(e => console.error(e));
                return; 
            } else if (!charList.includes(requestedPage)) {
                message.reply(`no codes on page ${requestedPage}, somehow`).catch(e => console.error(e));
                return; 
            }

            const codesEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.setTitle(`${requestedPage} Codes`)
			.setAuthor({ name: 'Google Translate', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/1024px-Google_Translate_logo.svg.png' })
			.setFooter({ text: 'Powered by the Google Translate API!' });

            langs.forEach(item => {
                if (item.name.toLowerCase().startsWith(requestedPage)) {
                    codesEmbed.addFields(item)
                }
            })

		    message.reply({ embeds: [codesEmbed] }).catch(e => console.error(e));

            return; 
        }

        const translate = require('google-translate-api-x'); // Connect to the Google Translate API

        const langTypeFrom = args[0];
        const langTypeTo = args[1];
        const rawMessage = message.content.replace(`${prefix}translate ${langTypeFrom} ${langTypeTo}`, '');

        translate(rawMessage, {from: langTypeFrom, to: langTypeTo}).then(res => {

            const translateEmbed = new EmbedBuilder()
			.setColor(embedColors.blue)
			.setTitle('Translation Output')
			.setAuthor({ name: 'Google Translate', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/1024px-Google_Translate_logo.svg.png' })
            .addFields(
				{ name: 'Raw', value: rawMessage, inline: true },
				{ name: 'Output', value: res.text, inline: true }
			)
			.setFooter({ text: 'Powered by the Google Translate API!' });

		    message.reply({ embeds: [translateEmbed] }).catch(e => console.error(e));

        }).catch(console.error);
    }
}