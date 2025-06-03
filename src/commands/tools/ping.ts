import { Command } from "src/utility/command.js";
import { EmbedBuilder } from "discord.js";

const Ping = new Command({
  name: "ping",
  description: "Pings the bot and returns the response.",
  execute: async (ctx) => {
    // console.log(ctx.data.client);
		const pingEmbed = new EmbedBuilder()
			.setColor(0x5282EC)
			.addFields(
				{ name: "Ping Time", value: `${ctx.data.client.ws.ms ?? "Undefined "}ms`}
			)
			.setFooter({ text: "pong you bumbling pillock" });

    await ctx.reply({ embeds: [pingEmbed] });
  },
});

export default Ping;
