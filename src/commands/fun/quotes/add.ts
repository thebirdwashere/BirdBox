import { Subcommand, CommandOption } from "@src/utility/command.js";
import { QuoteData } from "@src/utility/types.js";
import { formatQuoteEmbed } from "./utils.js";

const QuotesAdd = new Subcommand({
  name: "add",
  description: "Add a quote to this server's record.",
  options: [
    new CommandOption({
      name: "text",
      description: "The content of your new quote.",
      type: "string",
    }),
    new CommandOption({
      name: "quotee",
      description: "The user being quoted.",
      type: "user",
    }),
  ],
  contextmenu: {
    type: "message",
    label: "add to quotes",
    contextOption: "text",
    userContextOption: "quotee"
  },
  execute: async (ctx, opts) => {
    if (!ctx.guild) {
      await ctx.reply("Sorry, you can only add quotes inside a server.");
      return;
    }

    const text = opts.string.get("text");
    if (!text)
      throw new Error("Unable to locate quote text.");

    const quotedUser = opts.user.get("quotee");
    if (!quotedUser)
      throw new Error("Unable to locate quotee.");
        
    const quoteDate = new Date(new Date(ctx.timestamp).toDateString());

    const dateString = quoteDate.toLocaleDateString(undefined, { 
      month: "long", 
      day: "numeric", 
      year: "numeric"
    });

    const newQuote: QuoteData = {
      text,
      userid: quotedUser.id,
      username: quotedUser.displayName,
      date: dateString,
    };

    const currentQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];
    currentQuotes.push(newQuote);
    ctx.db.server.update(ctx.guild.id, "quotes", currentQuotes);
        
    await ctx.reply({ content: `New quote added from **${quotedUser.displayName}**!`, embeds: [await formatQuoteEmbed(ctx, newQuote, currentQuotes.length, "new")] });
  },
});

export default QuotesAdd;