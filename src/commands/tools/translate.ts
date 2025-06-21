import { Command, Subcommand, CommandOption } from "src/utility/command.js";
import { EmbedBuilder, Colors } from "discord.js";
import { Languages } from "../../utility/types.js";
import { translate } from "google-translate-api-x"; // Connect to the Google Translate API
import languages from "../../data/languages.json" with { type: "json" };

const LANGUAGES = languages as Languages;

const Translate = new Command({
    name: "translate",
    description: "Uses the Google Translate API to convert text.",
    subcommands: [
        new Subcommand({
            name: "codes",
            description: "Shows a list of language codes in alphabetical order.",
            options: [
                new CommandOption({
                    name: "page",
                    description: "Letter to jump to.",
                    type: "string",
                }),
            ],
            execute: async (ctx, opts) => {
                const lettersList = "abcdefghijklmnopqrstuvwxyz".split("");
                const charList = "abdefghijklmnprstuvwxyz".split("");
                const requestedPage = opts.string.get("page");
                if (requestedPage === null || requestedPage === undefined) throw new Error("Must provide a page.");

                if (!lettersList.includes(requestedPage)) {
                    throw new Error("Provided page is not a letter A-Z.");
                } else if (!charList.includes(requestedPage)) {
                    throw new Error("Requested page has no contents.");
                }

                const codesEmbed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle(`${requestedPage} Codes`)
                .setAuthor({ name: "Google Translate", iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/1024px-Google_Translate_logo.svg.png" })
                .setFooter({ text: "Powered by the Google Translate API!" });

                LANGUAGES.forEach(item => {
                    if (item.name.toLowerCase().startsWith(requestedPage)) {
                        codesEmbed.addFields(item);
                    }
                });

                await ctx.reply({ embeds: [codesEmbed] });
            },
        }),
        new Subcommand({
            name: "message",
            description: "Uses the Google Translate API to convert text.",
            options: [
                new CommandOption({
                    name: "from",
                    description: "The language to translate from. Must be a language code, as described in the codes subcommand.",
                    type: "string",
                }),
                new CommandOption({
                    name: "to",
                    description: "The language to translate to. Must be a language code, as described in the codes subcommand.",
                    type: "string",
                }),
                new CommandOption({
                    name: "text",
                    description: "The message you want translated.",
                    type: "string",
                }),
            ],
            execute: async (ctx, opts) => {
                const langTypeFrom = opts.string.get("from");
                const langTypeTo = opts.string.get("to");
                const rawMessage = opts.string.get("text");

                if (langTypeFrom == null || langTypeTo == null || rawMessage == null) throw new Error("One or more required fields not filled.");
                if (rawMessage.length >= 5000) throw new Error("Provided text is too long. Please shorten your request to below 5000 characters.");
                
                const validLanguages = LANGUAGES.map(item => item.value).concat(LANGUAGES.map(item => item.name));
                if (!(validLanguages.includes(langTypeFrom))) throw new Error("Language to translate from is invalid. Ensure you have the right language name or code.");
                if (!(validLanguages.includes(langTypeTo))) throw new Error("Language to translate to is invalid. Ensure you have the right language name or code.");

                interface Translation {
                    text: string;
                }

                const translationResult: Translation = await translate(rawMessage, {from: langTypeFrom, to: langTypeTo}) as unknown as Translation;

                const translateEmbed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setTitle("Translation Output")
                    .setAuthor({ name: "Google Translate", iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/1024px-Google_Translate_logo.svg.png" })
                    .addFields(
                        { name: "Raw", value: rawMessage, inline: true },
                        { name: "Output", value: translationResult.text, inline: true }
                    )
                    .setFooter({ text: "Powered by the Google Translate API!" });

                await ctx.reply({ embeds: [translateEmbed] });
            },
        }),
    ],
});

export default Translate;