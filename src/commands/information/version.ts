import { Command, CommandOption } from "@src/utility/command.js";
import { EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, StringSelectMenuOptionBuilder, Interaction, ComponentType, ButtonInteraction, StringSelectMenuInteraction, Message } from "discord.js";
import patchNotes from "@src/data/updates.json" with { type: "json" };
import { PatchNotes } from "@src/utility/types.js";

const PATCH_NOTES = patchNotes as PatchNotes;

const Version = new Command({
  name: "version",
  description: "View new BirdBox patch notes or peruse past releases.",
  options: [
    new CommandOption({
      name: "version",
      description: "Which version to jump to. If not set, defaults to the latest version.",
      type: "string",
      optional: true,
    }),
  ],
  execute: async (ctx, opts) => {
    const version = opts.string.getOptional("version") ?? PATCH_NOTES[0].version;

    if (!PATCH_NOTES.map(item => item.version).includes(version)) throw new Error("Version provided does not exist.");
    let page: number = PATCH_NOTES.map(item => item.version).indexOf(version);

    if(page + 1 > PATCH_NOTES.length) throw new Error("Version provided predates all available versions."); // how did you even trigger this

    function updateEmbed(p: number) : EmbedBuilder[] {
      const developers = `Update by ${PATCH_NOTES[p].devs.join(", ")}`;
      const contributors = "contribs" in PATCH_NOTES[p] ? `With contribution from ${PATCH_NOTES[p].contribs?.join(", ") ?? ""}` : "";
      const notes = `● ${PATCH_NOTES[p].notes.join("\n● ").replaceAll("e;", ctx.prefix)}`;

      const infoEmbed = new EmbedBuilder()
        .setTitle(`${PATCH_NOTES[p].type} ${PATCH_NOTES[p].version}`)
        .setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp"})
        .setColor(Colors.White)
        .addFields({ name: developers, value: contributors })
        .addFields({ name: `v${PATCH_NOTES[p].version} Patch Notes`, value: notes })
        .setFooter({ text: `Release Date: ${PATCH_NOTES[p].date}` });

      return [infoEmbed];
    }

    const backButton = new ButtonBuilder()
      .setCustomId("backButton")
      .setLabel("🠈")
      .setStyle(ButtonStyle.Primary);
            
    const forwardButton = new ButtonBuilder()
      .setCustomId("forwardButton")
      .setLabel("🠊")
      .setStyle(ButtonStyle.Primary);
            
    const versionSelect = new StringSelectMenuBuilder()
      .setCustomId("versionSelect")
      .setPlaceholder("Select version...");

    const infoButtonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(backButton, forwardButton);
          
    const infoSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(versionSelect);

    PATCH_NOTES.forEach((item) => {
      versionSelect.addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel(item.version)
          .setValue(PATCH_NOTES.indexOf(item).toString())
      ]);
    });

    function updateRow(p: number): [ActionRowBuilder<StringSelectMenuBuilder>, ActionRowBuilder<ButtonBuilder>] { // Returns the updated row
      if(p <= 0) backButton.setDisabled(true); else backButton.setDisabled(false);
      if(p >= PATCH_NOTES.length - 1) forwardButton.setDisabled(true); else forwardButton.setDisabled(false);

      return [infoSelectRow, infoButtonRow];
    }

    await ctx.reply({ embeds: updateEmbed(page), components: updateRow(page) });

    const filter = (i: Interaction): boolean => i.user.id === ctx.user.id;

    ctx.collectInteractions({
      type: ComponentType.Button,
      idleTimeLimit: 60_000,
      filter,
      onInteraction: handleButtonInteraction,
      onTimeout: handleButtonTimeout,
    });

    async function handleButtonInteraction(_: Message, i: ButtonInteraction): Promise<void> {
      if (i.customId === "backButton") {
        page -= 1; if(page < 0) page = 0; if(page + 1 > PATCH_NOTES.length) page = PATCH_NOTES.length - 1;
      } else if (i.customId === "forwardButton") {
        page += 1; if(page < 0) page = 0; if(page + 1 > PATCH_NOTES.length) page = PATCH_NOTES.length - 1;
      }

      await i.deferUpdate();
      await i.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
    }

    async function handleButtonTimeout(msg: Message): Promise<void> {
      infoButtonRow.components.forEach(item => item.setDisabled(true));
      await msg.edit({ components: [infoSelectRow, infoButtonRow] });
    }

    ctx.collectInteractions({
      type: ComponentType.StringSelect,
      idleTimeLimit: 60_000,
      filter,
      onInteraction: handleSelectorInteraction,
      onTimeout: handleSelectorTimeout,
    });

    async function handleSelectorInteraction(msg: Message, i: StringSelectMenuInteraction): Promise<void> {
      page = parseInt(i.values[0]);
      await msg.edit({ embeds: updateEmbed(page), components: updateRow(page) });
      await i.deferUpdate();
    }

    async function handleSelectorTimeout(msg: Message): Promise<void> {
      infoSelectRow.components.forEach(item => item.setDisabled(true));
      await msg.edit({ components: [infoSelectRow, infoButtonRow] });
    }
  }
});

export default Version;