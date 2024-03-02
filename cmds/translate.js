const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'translate',
    description: "translate command",
    execute({message, args}, {prefix}){
        const translate = require('google-translate-api-x'); // Connect to the Google Translate API

        const langTypeFrom = args[0];
        const langTypeTo = args[1];
        const rawMessage = message.content.replace(`${prefix}translate ${langTypeFrom} ${langTypeTo}`, '');

        translate(rawMessage, {from: langTypeFrom, to: langTypeTo}).then(res => {

            const translateEmbed = new EmbedBuilder()
			.setColor(0xAA00FF)
			.setTitle('Translation Output')
			.setAuthor({ name: 'Google Translate', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/1024px-Google_Translate_logo.svg.png' })
            .addFields(
				{ name: 'Raw', value: rawMessage, inline: true },
				{ name: 'Output', value: res.text, inline: true }
			)
			.setFooter({ text: 'Powered by the Google Translate API!' });

		    message.channel.trysend({ embeds: [translateEmbed] });

        }).catch(console.error);
    }
}