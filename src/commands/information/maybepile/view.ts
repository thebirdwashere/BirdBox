import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, Colors, ButtonInteraction } from "discord.js";
import { Subcommand, CommandOption } from "src/utility/command.js";
import { handleCommandError } from "src/utility/error.js";
import { MaybepileEntry } from "src/utility/types.js";
import { getMaybepile, getPageNumber, maybepileAutocomplete } from "./utils.js";

const MaybepileView = new Subcommand({
  name: "view",
  description: "Simply take a look at the existing items.",
  options: [
    new CommandOption({
      name: "page",
      description: "The item to be displayed. Defaults to the Table of Contents if blank.",
      type: "string",
      optional: true,
      autocomplete: true,
    }),
  ],
  autocomplete: maybepileAutocomplete,
  execute: async (ctx, opts) => {
    const pageSelection = opts.string.get("page") ?? "0";
    const pileArray = getMaybepile(ctx.db);

    let pageNum = getPageNumber(pileArray, pageSelection);

    if (pageNum === 0) { //MARK: table of contents

      const tableOfContentsEmbed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle("The MaybePile")
        .setDescription("Take a look at and suggest potential features!")
        .setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp"})
        .setFooter({text: "Page 0 ● Also a bot that doesn't run on spaghetti code."});
                    
      for (const [index, item] of pileArray.slice(1, 24).entries()) {
        if (typeof item === "string")
          throw new Error("Found Table of Contents while indexing maybepile.");
        
        tableOfContentsEmbed.addFields({
          name: `${index.toString()}: ${item.title}`, 
          value: `Suggested by ${item.suggester} (*${item.claim.status}*)`, 
          inline: true
        });
      }

      if (pileArray.length > 25) {
        tableOfContentsEmbed.addFields({name: `...and ${(pileArray.length - 24).toString()} more`, value: "See their individual pages!", inline: true});
      } else if (pileArray.length === 25) {
        const twentyFifthItem = pileArray[25];
        tableOfContentsEmbed.addFields({
          name: `25: ${twentyFifthItem.title}`, 
          value: `Suggested by ${twentyFifthItem.suggester} (*${twentyFifthItem.claim.status}*)`, 
          inline: true
        });
      }

      await ctx.reply({embeds: [tableOfContentsEmbed]});

    } else { //MARK: specific item

      let chosenItem = pileArray.at(pageNum) as MaybepileEntry | undefined;
      if (chosenItem === undefined)
        throw new Error("Could not find an item at the chosen index. Ensure the page number you provided is correct.");

      function generateItemEmbed(item: MaybepileEntry): EmbedBuilder {
        const suggestedStatus = `Suggested by ${item.suggester}`;
        let claimStatus: string;
    
        if (item.claim.status == "claimed") {
          claimStatus = `Claimed by ${item.claim.user}`;
        } else if (item.claim.status == "in development") {
          claimStatus = `In development by ${item.claim.user}`;
        } else if (item.claim.status == "deprioritized") {
          claimStatus = "Deprioritized";
        } else {
          claimStatus = "Unclaimed";
        }
    
        const itemEmbed = new EmbedBuilder()
          .setColor(Colors.Purple)
          .setTitle("The Maybe Pile")
          .setDescription("Take a look at and suggest potential features!")
          .addFields({name: item.title, value: item.description})
          .setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp"})
          .setFooter({text: `Page ${pageNum.toString()} ● ${suggestedStatus} ● ${claimStatus}`});
                        
        return itemEmbed;
      }

      const leftButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId("maybepile-left")
        .setLabel("🡨");
      const rightButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId("maybepile-right")
        .setLabel("🡪");
      const buttonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(leftButton, rightButton);
                    
      if (pageNum === 1) {
        buttonRow.components[0].setDisabled(true);
      } else {
        buttonRow.components[0].setDisabled(false);
      }

      if (pageNum === pileArray.length - 1) {
        buttonRow.components[1].setDisabled(true);
      } else {
        buttonRow.components[1].setDisabled(false);
      }
                    
      const response = await ctx.reply({embeds: [generateItemEmbed(chosenItem)], components: [buttonRow]});

      const buttonCollector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000,
      });

      //MARK: button handlers
      async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
        const customId = i.customId;
        if (customId == "maybepile-left") {
          pageNum--;
        } else if (customId == "maybepile-right") {
          pageNum++;
        } else { //huh what
          await handleCommandError(ctx, "maybepile", new Error("what did you just press. how did this happen."));
          return;
        }

        chosenItem = pileArray.at(pageNum) as MaybepileEntry | undefined;

        if (chosenItem === undefined) {
          await handleCommandError(ctx, "maybepile", new Error("Could not find an item at the requested index."));
          return;
        }

        if (pageNum === 1) {
          buttonRow.components[0].setDisabled(true);
        } else {
          buttonRow.components[0].setDisabled(false);
        }

        if (pageNum === pileArray.length - 1) {
          buttonRow.components[1].setDisabled(true);
        } else {
          buttonRow.components[1].setDisabled(false);
        }

        await response.edit({embeds: [generateItemEmbed(chosenItem)], components: [buttonRow]});

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
  },
});

export default MaybepileView;
