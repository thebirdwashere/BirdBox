import { Command } from "src/utility/command.js";
import { EmbedBuilder } from "discord.js";
import perms from "../../data/perms.json" with { type: "json" };
import { Perms } from "../../utility/types.js";

const PERMS = perms as Perms;

const Credits = new Command({
  name: "credits",
  description: "Give some due credit to the people who worked on this bot.",
  execute: async (ctx) => {
        const creditsEmbed = new EmbedBuilder()
			.setColor(0xFFFFFF)
			.setTitle("Credits")
			.setDescription("Credits to the people who work/worked on this bot.")
			.addFields(
				{ name: "Host", value: Object.keys(PERMS.host)[0] },
				{ name: "Developers", value: Object.keys(PERMS.developer).join(", ") },
				{ name: "Contributors", value: Object.keys(PERMS.contributor).join(", ") },
				{ name: "Bot Testers", value: Object.keys(PERMS.botTester).join(", ") }
			)
			.setFooter({ text: "And an extra-special thanks to users like you!" });

        await ctx.reply({ embeds: [creditsEmbed] });
  },
});

export default Credits;
