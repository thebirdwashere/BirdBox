import { AutocompleteContext, CommandContext } from "@src/utility/context.js";
import footers from "@src/data/footers.json" with { type: "json" };
import { Footers, QuoteData } from "@src/utility/types.js";
import { randomChoice } from "@src/utility/utility.js";
import { PermissionFlagsBits, EmbedBuilder, Colors } from "discord.js";

const FOOTERS = footers as Footers;

//MARK: autocomplete
export async function quotesAutocomplete(ctx: AutocompleteContext): Promise<void> {
  if (!ctx.guild) {
    await ctx.respondMessage("sorry, quoting only works inside a server");
    return;
  }

  const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

  await ctx.respond(
    serverQuotes.map((quote, i) => (
      { 
        name: `${(i+1).toString()}: ${quote.text.replaceAll("\n", " ")}`, 
        value: (i+1).toString()
      }
    ))
  );
}

//MARK: permissions
export async function checkPermissions(ctx: CommandContext): Promise<boolean> {
  if (!ctx.guild)
    throw new Error("Checked permissions outside guild.");
  
  const serverMember = await ctx.guild.members.fetch(ctx.user.id);

  return serverMember.permissions.has(PermissionFlagsBits.ManageMessages);
}

//MARK: quote embed
export async function formatQuoteEmbed(ctx: CommandContext, quote: QuoteData, index: number, type: "new" | "random" | "specific"): Promise<EmbedBuilder> {
  if (!ctx.guild)
    throw new Error("Formatted quote outside guild.");

  const quoteEmbed = new EmbedBuilder()
    .setDescription(`> ${quote.text.replaceAll("\n", "\n> ")}`)
    .setColor(Colors.Blue);

  switch (type) {
  case "new": {
    quoteEmbed.
      setTitle(`New Quote from ${ctx.guild.name}`)
      .setFooter({ text: `Quote ${String(index)}`});
    
    break;
  } case "random": {
    quoteEmbed
      .setTitle(`Random Quote from ${ctx.guild.name}`)
      .setFooter({ text: `Quote ${String(index)} ● ${randomChoice(FOOTERS.quotes)}` });
    
    break;
  } case "specific": {
    quoteEmbed
      .setTitle(`Quote from ${ctx.guild.name}`)
      .setFooter({ text: `Quote ${String(index)} ● ${randomChoice(FOOTERS.quotes)}` });
    
    break;
  }
  }
        
  try {
    //try to grab the user in the server
    const quotedMember = await ctx.guild.members.fetch(quote.userid);
    quoteEmbed
      .setFields({ name: `-${quotedMember.displayName} (${quote.date})`, value: ""})
      .setThumbnail(quotedMember.displayAvatarURL());
  } catch {
    try {
      //if that fails, grab them outside the server
      const quotedUser = await ctx.data.client.users.fetch(quote.userid);
      quoteEmbed
        .setFields({ name: `-${quotedUser.displayName} (${quote.date})`, value: ""})
        .setThumbnail(quotedUser.displayAvatarURL());
    } catch {
      quoteEmbed
        .setFields({ name: `-${quote.username} (${quote.date})`, value: ""})
        .setThumbnail("https://cdn.discordapp.com/embed/avatars/2.png");
    }
  }

  return quoteEmbed;
}