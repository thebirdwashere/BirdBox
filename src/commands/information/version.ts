import { Command, CommandOption } from "src/utility/command.js";
import { EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, StringSelectMenuOptionBuilder, Interaction, ComponentType, ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import patchNotes from "../../data/updates.json" with { type: "json" };
import { PatchNotes } from "../../utility/types.js";

const PATCH_NOTES = patchNotes as PatchNotes;

const Version = new Command({
    name: "version",
    description: "View new BirdBox patch notes or peruse past releases.",
    options: [
        new CommandOption({
            name: "version",
            description: "Which version to jump to. If not set, defaults to the latest version.",
            type: "string",
            required: false,
        }),
    ],
    execute: async (ctx, opts) => {
        const version = opts.string.get("version") ?? PATCH_NOTES[0].version;

        if (!PATCH_NOTES.map(item => item.version).includes(version)) throw new Error("Version provided does not exist.");
        let page: number = PATCH_NOTES.map(item => item.version).indexOf(version);

        if(page + 1 > PATCH_NOTES.length) throw new Error("Version provided predates all available versions."); // how did you even trigger this

        function updateEmbed(p: number) : EmbedBuilder[] {
            const developers = `Update by ${PATCH_NOTES[p].devs.join(", ")}`;
            const contributors = "contribs" in PATCH_NOTES[p] ? `With contribution from ${PATCH_NOTES[p].contribs?.join(", ") ?? ""}` : "";
            const notes = `● ${PATCH_NOTES[p].notes.join("\n● ").replaceAll("e;", ctx.data.prefix)}`;

            const infoEmbed = new EmbedBuilder()
                .setTitle(`${PATCH_NOTES[p].type} ${PATCH_NOTES[p].version}`)
                .setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp"})
                .setColor(Colors.White)
                .addFields({ name: developers, value: contributors })
                .addFields({ name: `v${PATCH_NOTES[p].version} Patch Notes`, value: notes })
                .setFooter({ text: `Release Date: ${PATCH_NOTES[p].date}` });

            return [infoEmbed];
        }

		//TODO: Add component row

        function updateRow(p: number): [ActionRowBuilder<ButtonBuilder>, ActionRowBuilder<StringSelectMenuBuilder>] { // Returns the updated row
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

            patchNotes.forEach((item) => {
                versionSelect.addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel(item.version)
                        .setValue(patchNotes.indexOf(item).toString())
                ]);
            });

            if(p <= 0) backButton.setDisabled(true); else backButton.setDisabled(false);
            if(p >= patchNotes.length - 1) forwardButton.setDisabled(true); else forwardButton.setDisabled(false);

            const infoButtonRow = new ActionRowBuilder()
                .addComponents(backButton, forwardButton);
            
            const infoSelectRow = new ActionRowBuilder()
                .addComponents(versionSelect);

            return [infoSelectRow as ActionRowBuilder<ButtonBuilder>, infoButtonRow as ActionRowBuilder<StringSelectMenuBuilder>];
        }

        await ctx.reply({ embeds: updateEmbed(page), components: updateRow(page) });
        if (ctx.lastReply == null) throw new Error("Could not locate last reply.");

        const filter = (i: Interaction): boolean => i.user.id === ctx.user.id;

        async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
            if (i.customId === "backButton") {
                page -= 1; if(page < 0) page = 0; if(page + 1 > patchNotes.length) page = patchNotes.length - 1;
                await i.deferUpdate();
                await i.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
            } else if (i.customId === "forwardButton") {
                page += 1; if(page < 0) page = 0; if(page + 1 > patchNotes.length) page = patchNotes.length - 1;
                await i.deferUpdate();
                await i.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
            }
        }

        const buttonCollector = ctx.lastReply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000, filter });
        buttonCollector.on("collect", (i: ButtonInteraction): void => void handleButtonInteraction(i) );

        async function handleSelectorInteraction(i: StringSelectMenuInteraction): Promise<void> {
            page = parseInt(i.values[0]);
            await i.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
            await i.deferUpdate();
        }

        const selectCollector = ctx.lastReply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000, filter });
        selectCollector.on("collect", (i: StringSelectMenuInteraction): void => void handleSelectorInteraction(i) );
    },
});

export default Version;