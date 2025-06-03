import { Colors, EmbedBuilder } from "discord.js";
import { CommandContext } from "./context.js";

export async function handleError(
  ctx: CommandContext,
  originCommand: string,
  error: unknown,
): Promise<void> {
  console.error(error);
  await ctx.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Command Error")
        .addFields(
          { name: "Error message:", value: String(error), inline: true },
          { name: "In command:", value: originCommand, inline: true },
        )
        .setColor(Colors.Red),
    ],
  });
}
