import { Subcommand, CommandOption } from "@src/utility/command.js";
import { QuoteData } from "@src/utility/types.js";
import { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ModalSubmitInteraction, Message } from "discord.js";
import { quotesAutocomplete, checkPermissions, formatQuoteEmbed } from "./utils.js";

const QuotesEdit = new Subcommand({
  name: "edit",
  description: "Edit a specific quote.",
  options: [
    new CommandOption({
      name: "quote",
      description: "The index of the quote to be edited.",
      type: "string",
      autocomplete: true,
    })
  ],
  autocomplete: quotesAutocomplete,
  execute: async (ctx, opts) => { //MARK: setup
    if (!ctx.guild) {
      await ctx.reply("Sorry, you can only delete quotes inside a server.");
      return;
    }

    const hasPermission = await checkPermissions(ctx);
    if (!hasPermission) {
      await ctx.reply("Sorry, editing quotes requires the Manage Messages permission.");
      return;
    }

    const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

    if (serverQuotes.length === 0) {
      await ctx.reply(`No quotes were found in this server. Try adding some with \`${ctx.prefix}quotes add\`!`);
      return;
    }

    const requestedIndex = Number(opts.string.getRequired("quote"));

    if (isNaN(requestedIndex))
      throw new Error("Index is not a number.");

    //support negative numbers indexing from the end instead of the start
    const pageNum = requestedIndex > 0 ? requestedIndex - 1 : serverQuotes.length + requestedIndex;
    const requestedQuote = serverQuotes.at(pageNum);

    if (requestedIndex === 0 || requestedQuote === undefined)
      throw new Error("Couldn't find a quote at the requested index.");

    //MARK: modal fields
    const modalFields = [
      new ActionRowBuilder<TextInputBuilder>()
        .setComponents(
          new TextInputBuilder()
            .setCustomId("quotes-edit-date")
            .setLabel("Quote Date")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("The quote's date, ideally formatted as \"Month Day, Year\"")
            .setValue(requestedQuote.date)
            .setRequired(true)
            .setMinLength(1)
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .setComponents(
          new TextInputBuilder()
            .setCustomId("quotes-edit-text")
            .setLabel("Quote Text")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("The text of your quote.")
            .setValue(requestedQuote.text)
            .setRequired(true)
            .setMinLength(1)
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .setComponents(
          new TextInputBuilder()
            .setCustomId("quotes-edit-username")
            .setLabel("Quotee Username")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("The default username for the quotee.")
            .setValue(requestedQuote.username)
            .setRequired(true)
            .setMinLength(1)
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .setComponents(
          new TextInputBuilder()
            .setCustomId("quotes-edit-userid")
            .setLabel("Quotee User ID")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Do NOT touch this if you don't know what you're doing!")
            .setValue(requestedQuote.userid)
            .setRequired(true)
            .setMinLength(18)
            .setMaxLength(19)
        )
    ];

    const editModal = new ModalBuilder()
      .setCustomId("quotes-edit")
      .setTitle("Edit Quote")
      .setComponents(modalFields);

    const guildId = ctx.guild.id;

    //MARK: modal handler
    async function onModalSubmit(i: ModalSubmitInteraction, _: Message): Promise<void> {
      const newDate = i.fields.getTextInputValue("quotes-edit-date");
      const newText = i.fields.getTextInputValue("quotes-edit-text");
      const newUsername = i.fields.getTextInputValue("quotes-edit-username");
      const newId = i.fields.getTextInputValue("quotes-edit-userid");

      const newQuote: QuoteData = {
        date: newDate,
        text: newText,
        username: newUsername,
        userid: newId,
      };

      serverQuotes[pageNum] = newQuote;
      console.log(serverQuotes);
      ctx.db.server.update(guildId, "quotes", serverQuotes);

      await i.reply({ content: "The following quote was successfully edited!", embeds: [await formatQuoteEmbed(ctx, newQuote, pageNum, "specific")] });
    }

    await ctx.replyModal(editModal, onModalSubmit);
  }
});

export default QuotesEdit;
