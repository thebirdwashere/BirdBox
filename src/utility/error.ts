import { Colors, EmbedBuilder } from "discord.js";
import { CommandContext } from "./context.js";

export async function handleError(
  ctx: CommandContext,
  originCommand: string,
  error: unknown,
): Promise<void> {
  console.error(error);

  const embeds = [
    new EmbedBuilder()
      .setTitle("Command Error")
      .addFields(
        { name: "Message:", value: String(error), inline: true },
        { name: "In command:", value: originCommand, inline: true },
      )
      .setColor(Colors.Red),
  ];
  
  //if the reply fails for some reason, send it as a base message
  try {
    await ctx.reply({embeds});
  } catch {
    await ctx.send({embeds});
  }
}
