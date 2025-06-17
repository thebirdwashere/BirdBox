import { Command } from "src/utility/command.js";
import { EmbedBuilder, Colors, /*ButtonBuilder, ButtonStyle, ActionRowBuilder*/ } from "discord.js";

const Privacy = new Command({
    name: "privacy",
    description: "Privacy notice of information on data management.",
    execute: async (ctx) => {
        const privacyEmbed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setTitle("Privacy Policy")
			.setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256" })
			.setFooter({text: "User data and license information."})
			.setURL("https://birdbox.thebirdwashere.com/privacy.html");
		
		// const linkButton = new ButtonBuilder()
		// 	.setLabel("Link")
		// 	.setStyle(ButtonStyle.Link)
		// 	.setDisabled(false)
		// 	.setURL("https://birdbox.thebirdwashere.com/privacy.html");
		
		// const linkButtonRow = new ActionRowBuilder()
		// 	.addComponents(linkButton);

        await ctx.reply({ embeds: [privacyEmbed], /*components: [linkButtonRow]*/ });
    },
});

export default Privacy;