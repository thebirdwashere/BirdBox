import { Colors, EmbedBuilder } from "discord.js";
import { AutocompleteContext, CommandContext, MessageContext } from "./context.js";
import { InputError, NonLoggedError } from "./utility.js";

async function handleError(
  ctx: CommandContext,
  error: unknown,
  type: string,
): Promise<void> {
  //don't log errors that were the user's fault
  if (!(error instanceof InputError || error instanceof NonLoggedError))
    console.error(error);
  
  const embeds = [
    new EmbedBuilder()
      .setTitle(`${type} Error`)
      .addFields( 
        { name: "Message", value: String(error), inline: true },
        { name: `In ${type.toLowerCase()}:`, value: ctx.command, inline: true },
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
  error: unknown,
): Promise<void> {
  await handleError(ctx, error, "Command");
}

export async function handleInterjectionError(
  ctx: MessageContext,
  error: unknown,
): Promise<void> {
  await handleError(ctx, error, "Interjection");
}

//uncessary variables included in case we need them in future
export function handleAutocompleteError(
  _ctx: AutocompleteContext,
  error: unknown,
): void {
  console.error(error);
}