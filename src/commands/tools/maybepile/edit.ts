import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { Subcommand, CommandOption } from "src/utility/command.js";
import { MaybepileEntry } from "src/utility/types.js";
import { getMaybepile, getPageNumber, maybepileAutocomplete, updateMaybepile } from "./utils.js";

const MaybepileEdit = new Subcommand({
  name: "edit",
  description: "Edit an existing item.",
  options: [
    new CommandOption({
      name: "item",
      description: "The item to be edited.",
      type: "string",
      autocomplete: true,
    }),
  ],
  permissions: ["host", "developer"],
  autocomplete: maybepileAutocomplete,
  execute: async (ctx, opts) => {
    const itemSelection = opts.string.get("item");
    if (itemSelection == null)
      throw new Error("Unable to locate item number.");

    const pileArray = getMaybepile(ctx.db);

    const itemNum = getPageNumber(pileArray, itemSelection);

    const originalItem = pileArray.at(itemNum);
    if (originalItem == undefined) {
      await ctx.reply("bruh try editing an actual item");
      return;
    } else if (originalItem === "Table of Contents") {
      await ctx.reply("bruh you can't edit the table of contents lol");
      return;
    }

    const originalClaim = originalItem.claim;

    const modalFields = [
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId("maybepile-title")
            .setLabel("Title")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Title of the item.")
            .setValue(originalItem.title)
            .setRequired(true)
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId("maybepile-description")
            .setLabel("Description")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("The description of the item, displayed on the item's page.")
            .setValue(originalItem.description)
            .setRequired(true)
        ),
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId("maybepile-suggester")
            .setLabel("Suggester")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("User who suggested this item. Credit where it's due!")
            .setValue(originalItem.suggester)
            .setRequired(true)
        )
    ];
                        
    const editModal = new ModalBuilder()
      .setCustomId("maybepile-edit")
      .setTitle("Edit Maybepile Item")
      .addComponents(modalFields);

    const editButton = new ButtonBuilder()
      .setCustomId("maybepile-edit-button")
      .setLabel("Edit")
      .setStyle(ButtonStyle.Success);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(editButton);

    const response = await ctx.reply({ components: [buttonRow]});

    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
    });

    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      await i.showModal(editModal);
      
      const editFilter = (i: ModalSubmitInteraction): boolean => (
        i.user.id === ctx.user.id
        && i.customId === "maybepile-edit"
      );
      await i.awaitModalSubmit({ filter: editFilter, time: 120_000 })
        .then(
          async i => {
            const newItem: MaybepileEntry = {
              title: i.fields.getTextInputValue("maybepile-title"),
              description: i.fields.getTextInputValue("maybepile-description"),
              suggester: i.fields.getTextInputValue("maybepile-suggester"),
              claim: originalClaim,
            };

            pileArray[itemNum] = newItem;
            updateMaybepile(ctx.db, pileArray);

            await i.reply({content: `"${pileArray[itemNum].title}" has been edited successfully!`});
          }
        );
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
  },
});

export default MaybepileEdit;
