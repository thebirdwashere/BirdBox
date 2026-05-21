import { Subcommand, CommandOption } from "@src/utility/command.js";
import { handleCommandError } from "@src/utility/error.js";
import { QuoteData } from "@src/utility/types.js";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction, ComponentType } from "discord.js";
import { quotesAutocomplete, formatQuoteEmbed } from "./utils.js";

const QuotesGet = new Subcommand({
  name: "get",
  description: "Grab and display a specific quote.",
  options: [
    new CommandOption({
      name: "quote",
      description: "The index of the requested quote.",
      type: "string",
      autocomplete: true,
    })
  ],
  autocomplete: quotesAutocomplete,
  execute: async (ctx, opts) => { //MARK: main logic
    if (!ctx.guild) {
      await ctx.reply("Sorry, you can only review quotes inside a server.");
      return;
    }

    const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

    if (serverQuotes.length === 0) {
      await ctx.reply(`No quotes were found in this server. Try adding some with \`${ctx.prefix}quotes add\`!`);
      return;
    }

    const requestedQuoteIndex = Number(opts.string.get("quote"));
    let pageNum = requestedQuoteIndex - 1;

    if (isNaN(requestedQuoteIndex))
      throw new Error("Index is not a number.");

    let requestedQuote = serverQuotes.at(pageNum);

    if (requestedQuoteIndex === 0 || requestedQuote === undefined)
      throw new Error("Couldn't find a quote at the requested index.");

    //support negative numbers indexing from the end instead of the start
    let displayQuoteIndex = pageNum >= 0 ? pageNum + 1 : serverQuotes.length + pageNum + 1;

    const leftButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId("scratchpad-left")
      .setLabel("🡨");
    const rightButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId("scratchpad-right")
      .setLabel("🡪");
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(leftButton, rightButton);
                    
    if (pageNum === 0) {
      buttonRow.components[0].setDisabled(true);
    } else {
      buttonRow.components[0].setDisabled(false);
    }

    if (pageNum === serverQuotes.length - 1) {
      buttonRow.components[1].setDisabled(true);
    } else {
      buttonRow.components[1].setDisabled(false);
    }

    const response = await ctx.reply({ 
      embeds: [await formatQuoteEmbed(ctx, requestedQuote, displayQuoteIndex, "specific")],
      components: [buttonRow]
    });

    const buttonFilter = (i: ButtonInteraction): boolean => i.user.id === ctx.user.id;

    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120_000,
      filter: buttonFilter,
    });

    //MARK: button handlers
    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      const customId = i.customId;
      if (customId == "scratchpad-left") {
        pageNum--;
      } else if (customId == "scratchpad-right") {
        pageNum++;
      } else { //huh what
        await handleCommandError(ctx, "scratchpad", new Error("what did you just press. how did this happen."));
        return;
      }

      requestedQuote = serverQuotes.at(pageNum);
      displayQuoteIndex = pageNum >= 0 ? pageNum + 1 : serverQuotes.length + pageNum + 1;

      if (requestedQuote === undefined) {
        await handleCommandError(ctx, "scratchpad", new Error("Could not find an item at the requested index."));
        return;
      }

      if (pageNum === 0) {
        buttonRow.components[0].setDisabled(true);
      } else {
        buttonRow.components[0].setDisabled(false);
      }

      if (pageNum === serverQuotes.length - 1) {
        buttonRow.components[1].setDisabled(true);
      } else {
        buttonRow.components[1].setDisabled(false);
      }

      await response.edit({
        embeds: [await formatQuoteEmbed(ctx, requestedQuote, displayQuoteIndex, "specific")], 
        components: [buttonRow]
      });

      await i.deferUpdate();
    }
                    
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i) => {await handleButtonInteraction(i);});

    async function handleButtonTimeout(): Promise<void> {
      //disable the buttons
      buttonRow.components.forEach(item => item.setDisabled(true));
      await response.edit({ components: [buttonRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async () => {await handleButtonTimeout();});
  }
});

export default QuotesGet;