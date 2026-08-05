import { Subcommand, CommandOption } from "@src/utility/command.js";
import { QuoteData } from "@src/utility/types.js";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ButtonInteraction, ComponentType, Message } from "discord.js";
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

    const requestedIndex = Number(opts.string.getRequired("quote"));

    if (isNaN(requestedIndex))
      throw new Error("Index is not a number.");

    //support negative numbers indexing from the end instead of the start
    let pageNum = requestedIndex > 0 ? requestedIndex - 1 : serverQuotes.length + requestedIndex;
    let requestedQuote = serverQuotes.at(pageNum);

    if (requestedIndex === 0 || requestedQuote === undefined)
      throw new Error("Couldn't find a quote at the requested index.");

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

    await ctx.reply({
      embeds: [await formatQuoteEmbed(ctx, requestedQuote, pageNum, "specific")],
      components: [buttonRow]
    });

    ctx.collectInteractions({
      type: ComponentType.Button,
      idleTimeLimit: 120_000,
      filter: (i: ButtonInteraction): boolean => i.user.id === ctx.user.id,
      onInteraction,
      onTimeout,
    });

    //MARK: button handlers
    async function onInteraction(msg: Message, i: ButtonInteraction): Promise<void> {
      const customId = i.customId;
      if (customId == "scratchpad-left") {
        pageNum--;
      } else if (customId == "scratchpad-right") {
        pageNum++;
      } else { //huh what
        throw new Error("what did you just press. how did this happen.");
      }

      requestedQuote = serverQuotes.at(pageNum);
      pageNum = pageNum >= 0 ? pageNum : serverQuotes.length + pageNum;

      if (requestedQuote === undefined) {
        throw new Error("Could not find an item at the requested index.");
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

      await msg.edit({
        embeds: [await formatQuoteEmbed(ctx, requestedQuote, pageNum, "specific")],
        components: [buttonRow]
      });

      await i.deferUpdate();
    }

    async function onTimeout(msg: Message): Promise<void> {
      buttonRow.components.forEach(item => item.setDisabled(true));
      await msg.edit({ components: [buttonRow] });
    }
  }
});

export default QuotesGet;
