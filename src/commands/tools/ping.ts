import { Command } from "src/utility/command.js";
import { Colors, EmbedBuilder } from "discord.js";

const Ping = new Command({
  name: "ping",
  description: "Pings the bot and returns the response.",
  execute: async (ctx) => {
		const pingEmbed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.addFields(
				{ name: "Ping Time", value: `${ctx.data?.client?.ws?.ping ?? "Undefined "}ms`}
			)
			.setFooter({ text: "pong you bumbling pillock" });

    await ctx.reply({ embeds: [pingEmbed] });
  },
});

export default Ping;
