import { Colors, EmbedBuilder } from "discord.js";
import { AutocompleteContext, CommandContext, MessageContext } from "./context.js";

async function handleError(
  ctx: CommandContext,
  originCommand: string,
  error: unknown,
  type: string,
): Promise<void> {
  console.error(error);

  const embeds = [
    new EmbedBuilder()
      .setTitle(`${type} Error`)
      .addFields( 
        { name: "Message:", value: String(error), inline: true },
        { name: `In ${type.toLowerCase()}:`, value: originCommand, inline: true },
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


export async function handleCommandError(
  ctx: CommandContext,
  originCommand: string,
  error: unknown,
): Promise<void> {
  await handleError(ctx, originCommand, error, "Command");
}

export async function handleInterjectionError(
  ctx: MessageContext,
  originCommand: string,
  error: unknown,
): Promise<void> {
  await handleError(ctx, originCommand, error, "Interjection");
}

export function handleAutocompleteError(
  _ctx: AutocompleteContext,
  _originCommand: string,
  error: unknown,
): void {
  console.error(error);
}