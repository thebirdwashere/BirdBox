import { Command } from "src/utility/command.js";
import { EmbedBuilder, Colors } from "discord.js";

const Credits = new Command({
  	name: "credits",
  	description: "Give some due credit to the people who worked on this bot.",
  	execute: async (ctx) => {
		const perms = ctx.data.perms;

        const creditsEmbed = new EmbedBuilder()
			.setColor(Colors.White)
			.setTitle("Credits")
			.setDescription("Credits to the people who work/worked on this bot.")
			.addFields(
				{ name: "Host", value: Object.keys(perms.host)[0] },
				{ name: "Developers", value: Object.keys(perms.developer).join(", ") },
				{ name: "Contributors", value: Object.keys(perms.contributor).join(", ") },
				{ name: "Bot Testers", value: Object.keys(perms.botTester).join(", ") }
			)
			.setFooter({ text: "And an extra-special thanks to users like you!" });

        await ctx.reply({ embeds: [creditsEmbed] });
  	},
});

export default Credits;
