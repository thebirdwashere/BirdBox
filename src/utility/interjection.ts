import { EmbedBuilder } from "discord.js";
import { MessageContext } from "./context.js";
import { fetchConfigOption } from "./utility.js";

export class Interjection {
  name: string;
  test: (ctx: MessageContext) => Promise<void> | void;

  constructor(
    args: {
      name: string;
      test: (ctx: MessageContext) => Promise<void> | void;
    },
  ) {
    this.name = args.name;
    this.test = args.test;
  }
}

export async function notifyOfInterjection(ctx: MessageContext, embedProperties: {
  displayString: string, 
  emoji: string, 
  color: number,
  description: string, 
  footer: string
}): Promise<void> {
  if (!ctx.guild) return;
    
  const notifSetting = fetchConfigOption(ctx.db, "user", "notifs", ctx.user.id);
  if (notifSetting === "none") return;

  const notifChanneId = fetchConfigOption(ctx.db, "server", "notifications", ctx.guild.id) as string | null;
  if (notifChanneId === null) return;

  const notifChannel = await ctx.guild.channels.fetch(notifChanneId);
  if (!notifChannel) return;

  if (!("send" in notifChannel))
    throw new Error("Messages cannot be sent in the current notification channel.");
  
  //make sure we don't go over embed char limits
  const displaySplit = embedProperties.displayString.match(/(.{1,1000})/g); 

  if (displaySplit === null)
    throw new Error("Could not locate display text for embed formatting.");
        
  const newEmbed = new EmbedBuilder()
    .setColor(embedProperties.color)
    .setTitle(`| ${embedProperties.emoji} | ${ctx.user.displayName}'s message`)
    .setDescription(`${embedProperties.description}! Take a look:`)
    .addFields({name: " ", value: " "})
    .setURL(ctx.message.url)
    .setFooter({text: embedProperties.footer});
        
  displaySplit.forEach(str => { //embed char limits once again
    newEmbed.addFields({name: " ", value: `\`${str}\``});
  });
  newEmbed.addFields({name: " ", value: " "});
    
  const ping = notifSetting === "ping" ? `<@${ctx.user.id}>` : ""; //only ping if requested
  await notifChannel.send({content: ping, embeds: [newEmbed]});
}