import { Command } from "@src/utility/command.js";
import { Colors, EmbedBuilder } from "discord.js";
import footers from "@src/data/footers.json" with { type: "json" };
import { Footers, SnipedMessage } from "@src/utility/types.js";
import { randomChoice } from "@src/utility/utility.js";

const FOOTERS = footers as Footers;

const Snipe = new Command({
  name: "snipe",
  description: "Snipes the latest deleted message in this channel. Opt-in per user, so it may not work!",
  execute: async (ctx) => {
    if (!ctx.channel)
      throw new Error("Error: Could not find the ID of the current channel.");

    const snipeData = ctx.db.channel.fetchOrUndefined(ctx.channel.id, "snipe");

    if (snipeData === undefined) {
      await ctx.reply("this command is garbage apparently cause i cant find a dang thing here");
      return;
    };

    const snipedMessage = snipeData as SnipedMessage;

    const snipedMember = await ctx.guild?.members.fetch(snipedMessage.authorID);
    if (!snipedMember)
      throw new Error(`Could not find the sniped user with ID ${snipedMessage.authorID}.`);

    const snipeEmbed = new EmbedBuilder()
      .setTitle(`Deleted from: <#${ctx.channel.id}>`)
      .setAuthor({ 
        name: (snipedMember.nickname ?? snipedMember.displayName), 
        iconURL: snipedMember.user.displayAvatarURL()
      })
      .setColor(Colors.Blue)
      .setDescription(snipedMessage.content)
      .setImage(snipedMessage.imageURL ?? null)
      .setFooter({ text: randomChoice(FOOTERS.snipe) })
      .setTimestamp(snipedMessage.timestamp);

    await ctx.reply({ embeds: [snipeEmbed] });
  },
});

export default Snipe;
