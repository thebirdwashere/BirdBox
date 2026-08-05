import { Subcommand, CommandOption } from "@src/utility/command.js";
import { QuoteData } from "@src/utility/types.js";
import { quotesAutocomplete, checkPermissions, formatQuoteEmbed } from "./utils.js";

const QuotesDelete = new Subcommand({
  name: "delete",
  description: "Delete a specific quote. Irreversible, so be careful!",
  options: [
    new CommandOption({
      name: "quote",
      description: "The index of the quote to be deleted.",
      type: "string",
      autocomplete: true,
    })
  ],
  autocomplete: quotesAutocomplete,
  execute: async (ctx, opts) => {
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

    serverQuotes.splice(pageNum);
    ctx.db.server.update(ctx.guild.id, "quotes", serverQuotes);

    await ctx.reply({ content: "The following quote was successfully deleted!", embeds: [await formatQuoteEmbed(ctx, requestedQuote, pageNum, "specific")] });
  }
});

export default QuotesDelete;
