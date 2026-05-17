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

    const requestedQuoteIndex = Number(opts.string.get("quote"));

    if (isNaN(requestedQuoteIndex))
      throw new Error("Index is not a number.");

    const requestedQuote = serverQuotes.at(requestedQuoteIndex-1);

    if (requestedQuoteIndex === 0 || requestedQuote === undefined)
      throw new Error("Couldn't find a quote at the requested index.");

    //support negative numbers indexing from the end instead of the start
    const displayQuoteIndex = requestedQuoteIndex >= 1 ? requestedQuoteIndex : serverQuotes.length + requestedQuoteIndex;

    serverQuotes.splice(requestedQuoteIndex-1);
    ctx.db.server.update(ctx.guild.id, "quotes", serverQuotes);

    await ctx.reply({ content: "The following quote was successfully deleted!", embeds: [await formatQuoteEmbed(ctx, requestedQuote, displayQuoteIndex, "specific")] });
  }
});
    
export default QuotesDelete;