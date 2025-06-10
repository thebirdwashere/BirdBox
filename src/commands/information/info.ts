import { Command } from "src/utility/command.js";
import { EmbedBuilder } from "discord.js";
import patchNotes from "../../data/updates.json" with { type: "json" };
import { PatchNotes } from "../../utility/types.js";

const PATCH_NOTES = patchNotes as PatchNotes;

const Info = new Command({
    name: "info",
    description: "A summary of BirdBox information and resources.",
    execute: async (ctx) => {
        const infoEmbed = new EmbedBuilder()
			.setColor(0xFFFFFF)
			.setTitle("Information")
            .setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp" })
            .setDescription("A discord bot concentrating on humorous features and interactions, while also providing a couple nice utilities. The original project was created in late January 2021 using Zapier and BotGhost, and was rewritten in November 2021 using discord.js. Primarily a hobby project with pretty slow development, but we hope you get some enjoyment or even use out of it regardless!")
			.addFields(
                { name: "Latest Version", value: PATCH_NOTES[0].version },
                { name: "Last Updated", value: PATCH_NOTES[0].date },
				{ name: "Credits", value: `\`${ctx.data.prefix}credits\`` },
                { name: "Server", value: `\`${ctx.data.prefix}neofetch\`` },
				{ name: "Github", value: "https://github.com/thebirdwashere/BirdBox" },
			)
			.setFooter({ text: "Special thanks to users like you!" });

        await ctx.reply({ embeds: [infoEmbed] });
    }
});

export default Info;