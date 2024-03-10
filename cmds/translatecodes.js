const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'translatecodes',
    description: 'gives codes for translate command',
    hidden: true,
    execute({message, args}) {
        const newEmbed = new EmbedBuilder()
        .setColor('#cbe1ec')
        .setTitle('Translate Codes')
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
        .setDescription('Learn about this bot and what it can do.')

        switch (args[1]) {
            case "a": case "A":
                newEmbed
                .addFields(
                    {value: "auto", name: "Automatic"}, 
                    {value: "af", name: "Afrikaans"}, 
                    {value: "sq", name: "Albanian"}, 
                    {value: "am", name: "Amharic"}, 
                    {value: "ar", name: "Arabic"}, 
                    {value: "hy", name: "Armenian"}, 
                    {value: "az", name: "Azerbaijani"}
                )
                .setFooter({text: 'Valid translate codes, page A'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "b": case "B":
                newEmbed
                .addFields( 
                    {value: "eu", name: "Basque"}, 
                    {value: "be", name: "Belarusian"}, 
                    {value: "bn", name: "Bengali"}, 
                    {value: "bs", name: "Bosnian"}, 
                    {value: "bg", name: "Bulgarian"}
                )
                .setFooter({text: 'Valid translate codes, page B'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "c": case "C":
                newEmbed
                .addFields( 
                    {value: "ca", name: "Catalan"}, 
                    {value: "ceb", name: "Cebuano"}, 
                    {value: "ny", name: "Chichewa"}, 
                    {value: "zh-cn", name: "Chinese (Simplified)"}, 
                    {value: "zh-tw", name: "Chinese (Traditional)"}, 
                    {value: "co", name: "Corsican"}, 
                    {value: "hr", name: "Croatian"}, 
                    {value: "cs", name: "Czech"}, 
                )
                .setFooter({text: 'Valid translate codes, page C'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "d": case "D":
                newEmbed
                .addFields( 
                    {value: "da", name: "Danish"}, 
                    {value: "nl", name: "Dutch"}
                )
                .setFooter({text: 'Valid translate codes, page D'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "e": case "E":
                newEmbed
                .addFields( 
                    {value: "en", name: "English"}, 
                    {value: "eo", name: "Esperanto"}, 
                    {value: "et", name: "Estonian"}
                )
                .setFooter({text: 'Valid translate codes, page E'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "f": case "F":
                newEmbed
                .addFields( 
                    {value: "tl", name: "Filipino"}, 
                    {value: "fi", name: "Finnish"}, 
                    {value: "fr", name: "French"}, 
                    {value: "fy", name: "Frisian"}
                )
                .setFooter({text: 'Valid translate codes, page F'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "g": case "G":
                newEmbed
                .addFields( 
                    {value: "gl", name: "Galician"},
                    {value: "ka", name: "Georgian"}, 
                    {value: "de", name: "German"}, 
                    {value: "el", name: "Greek"}, 
                    {value: "gu", name: "Gujarati"}
                )
                .setFooter({text: 'Valid translate codes, page G'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "h": case "H":
                newEmbed
                .addFields( 
                    {value: "ht", name: "Haitian Creole"}, 
                    {value: "ha", name: "Hausa"}, 
                    {value: "haw", name: "Hawaiian"}, 
                    {value: "iw", name: "Hebrew"}, 
                    {value: "hi", name: "Hindi"}, 
                    {value: "hmn", name: "Hmong"}, 
                    {value: "hu", name: "Hungarian"}, 
                )
                .setFooter({text: 'Valid translate codes, page H'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "i": case "I":
                newEmbed
                .addFields( 
                    {value: "is", name: "Icelandic"}, 
                    {value: "ig", name: "Igbo"}, 
                    {value: "id", name: "Indonesian"}, 
                    {value: "ga", name: "Irish"}, 
                    {value: "it", name: "Italian"}, 
                )
                .setFooter({text: 'Valid translate codes, page I'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "j": case "J":
                newEmbed
                .addFields( 
                    {value: "ja", name: "Japanese"}, 
                    {value: "jw", name: "Javanese"}
                )
                .setFooter({text: 'Valid translate codes, page J'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "k": case "K":
                newEmbed
                .addFields( 
                    {value: "kn", name: "Kannada"}, 
                    {value: "kk", name: "Kazakh"},
                    {value: "km", name: "Khmer"}, 
                    {value: "ko", name: "Korean"}, 
                    {value: "ku", name: "Kurdish (Kurmanji)"}, 
                    {value: "ky", name: "Kyrgyz"}, 
                )
                .setFooter({text: 'Valid translate codes, page K'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "l": case "L":
                newEmbed
                .addFields( 
                    {value: "lo", name: "Lao"}, 
                    {value: "la", name: "Latin"}, 
                    {value: "lv", name: "Latvian"}, 
                    {value: "lt", name: "Lithuanian"}, 
                    {value: "lb", name: "Luxembourgish"}, 
                )
                .setFooter({text: 'Valid translate codes, page L'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "m": case "M":
                newEmbed
                .addFields( 
                    {value: "mk", name: "Macedonian"}, 
                    {value: "mg", name: "Malagasy"}, 
                    {value: "ms", name: "Malay"}, 
                    {value: "ml", name: "Malayalam"}, 
                    {value: "mt", name: "Maltese"}, 
                    {value: "mi", name: "Maori"}, 
                    {value: "mr", name: "Marathi"}, 
                    {value: "mn", name: "Mongolian"}, 
                    {value: "my", name: "Myanmar (Burmese)"}, 
                )
                .setFooter({text: 'Valid translate codes, page M'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "n": case "N":
                newEmbed
                .addFields( 
                    {value: "ne", name: "Nepali"}, 
                    {value: "no", name: "Norwegian"}, 
                )
                .setFooter({text: 'Valid translate codes, page N'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "o": case "O":
                message.tryreply("no page for O, somehow");
                break;
            case "p": case "P":
                newEmbed
                .addFields( 
                    {value: "ps", name: "Pashto"}, 
                    {value: "fa", name: "Persian"}, 
                    {value: "pl", name: "Polish"}, 
                    {value: "pt", name: "Portuguese"}, 
                    {value: "ma", name: "Punjabi"}, 
                )
                .setFooter({text: 'Valid translate codes, page P'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "q": case "Q":
                message.tryreply("no page for Q, somehow");
                break;
            case "r": case "R":
                newEmbed
                .setColor('#cbe1ec')
                .setTitle('Valid translate language codes.')
                .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
                .setDescription('Learn about this bot and what it can do.')
                .addFields( 
                    {value: "ro", name: "Romanian"}, 
                    {value: "ru", name: "Russian"}, 
                )
                .setFooter({text: 'Valid translate codes, page R'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "s": case "S":
                newEmbed
                .addFields( 
                    {value: "sm", name: "Samoan"}, 
                    {value: "gd", name: "ScotsGaelic"}, 
                    {value: "sr", name: "Serbian"}, 
                    {value: "st", name: "Sesotho"}, 
                    {value: "sn", name: "Shona"}, 
                    {value: "sd", name: "Sindhi"}, 
                    {value: "si", name: "Sinhala"}, 
                    {value: "sk", name: "Slovak"}, 
                    {value: "sl", name: "Slovenian"}, 
                    {value: "so", name: "Somali"}, 
                    {value: "es", name: "Spanish"}, 
                    {value: "su", name: "Sundanese"}, 
                    {value: "sw", name: "Swahili"}, 
                    {value: "sv", name: "Swedish"}, 
                )
                .setFooter({text: 'Valid translate codes, page S'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "t": case "T":
                newEmbed
                .addFields( 
                    {value: "tg", name: "Tajik"}, 
                    {value: "ta", name: "Tamil"}, 
                    {value: "te", name: "Telugu"}, 
                    {value: "th", name: "Thai"}, 
                    {value: "tr", name: "Turkish"}, 
                )
                .setFooter({text: 'Valid translate codes, page T'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "u": case "U":
                newEmbed
                .addFields( 
                    {value: "uk", name: "Ukrainian"}, 
                    {value: "ur", name: "Urdu"}, 
                    {value: "uz", name: "Uzbek"}, 
                )
                .setFooter({text: 'Valid translate codes, page U'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "v": case "V":
                newEmbed
                .addFields( 
                    {value: "vi", name: "Vietnamese"}
                )
                .setFooter({text: 'Valid translate codes, page V'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "w": case "W":
                newEmbed
                .addFields( 
                    {value: "cy", name: "Welsh"},
                )
                .setFooter({text: 'Valid translate codes, page W'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "x": case "X":
                newEmbed
                .addFields( 
                    {value: "xh", name: "Xhosa"}, 
                )
                .setFooter({text: 'Valid translate codes, page X'})

                message.tryreply({embeds: [newEmbed]});
                break;
            case "y": case "Y":
                newEmbed
                .addFields( 
                    {value: "yi", name: "Yiddish"}, 
                    {value: "yo", name: "Yoruba"}, 
                    )
                    .setFooter({text: 'Valid translate codes, page Y'})
    
                    message.tryreply({embeds: [newEmbed]});
                break;
            case "z": case "Z":
                newEmbed
                .addFields( 
                    {value: "zu", name: "Zulu"}
                )
                .setFooter({text: 'Valid translate codes, page Z'})

                message.tryreply({embeds: [newEmbed]});
                break;
            default:
            message.tryreply("that isn't a letter, use A-Z to go to a page");
        }
    }
}