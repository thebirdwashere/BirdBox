const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const translate = require('google-translate-api-x');
const { langs } = require('../../utils/json/langs.json');

module.exports = {
    data: new SlashCommandBuilder()
		.setName('translate') // TODO: add subcommand for the equivalent of e;translate codes, maybe add subcommand for displaying in a modal?
		.setDescription('Uses the Google Translate API to convert text.')
        .addStringOption(option =>
			option
				.setName('from') // TODO: add autocomplete for language codes and names
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
        ),
    async autocomplete(interaction) {

        const choices = langs.map(item => item.name);

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.charAt(0).toUpperCase() + focusedOption.value.slice(1)
        let filtered = choices.filter(choice => choice.startsWith(value));
        filtered = filtered.map(choice => ({ name: choice, value: choice }));
        filtered = filtered.slice(0, 25);

        console.log(filtered)

        await interaction.respond(filtered);

    },
    async execute(interaction, {embedColor}) {

        /* if (args[0] == "codes") { require(`./translatecodes`).execute({message, args}); return; } */ // add a subcommand for this in the future
        // ...langs converts the array into function arguments

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
                .setColor(embedColor)
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

    }
}