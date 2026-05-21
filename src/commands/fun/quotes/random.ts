import { Subcommand, CommandOption } from "@src/utility/command.js";
import { QuoteData } from "@src/utility/types.js";
import { formatQuoteEmbed } from "./utils.js";

const QuotesRandom = new Subcommand({
  name: "random",
  description: "Pull a random quote from this server.",
  options: [
    new CommandOption({
      name: "member",
      description: "Choose a member to find quotes of. If not set, will choose a random quote across the server.",
      type: "user",
      optional: true,
    })
  ],
  execute: async (ctx, opts) => {
    if (!ctx.guild) {
      await ctx.reply("Sorry, you can only review quotes inside a server.");
      return;
    }

    const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

    if (serverQuotes.length === 0) {
      await ctx.reply(`No quotes were found in this server. Try adding some with \`${ctx.prefix}quotes add\`!`);
      return;
    }

    const filterMember = opts.user.get("member");

    let randomIndex: number;
    let randomQuote: QuoteData;
    if (filterMember) {
      const filteredQuotes = serverQuotes.filter(quote => quote.userid === filterMember.id);
      if (filteredQuotes.length === 0) {
        await ctx.reply(`No quotes were found from ${filterMember.displayName}. Try adding some with \`${ctx.prefix}quotes add\`!`);
        return;
      }
        
      randomIndex = Math.floor(Math.random() * filteredQuotes.length);
      randomQuote = filteredQuotes[randomIndex];
    } else {
      randomIndex = Math.floor(Math.random() * serverQuotes.length);
      randomQuote = serverQuotes[randomIndex];
    }

    await ctx.reply({ embeds: [await formatQuoteEmbed(ctx, randomQuote, randomIndex+1, "specific")] });
  }
});

export default QuotesRandom;