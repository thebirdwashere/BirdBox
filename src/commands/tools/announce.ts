import { Command, CommandOption } from "src/utility/command.js";
import { EmbedBuilder } from "discord.js";
import { fetchConfigOption } from "src/utility/utility.js";

const Announce = new Command({
  name: "announce",
  description: "Echo a message to another channel.",
  options: [
    new CommandOption({
      name: "message",
      description: "The message to announce.",
      type: "string",
    }),
    new CommandOption({
      name: "channel",
      description: "The channel to be announced to. If not set, defaults to the server-configured default channel.",
      type: "channel",
      optional: true,
    }),
  ],
  // eslint-disable-next-line @typescript-eslint/require-await
  execute: async (ctx, opts) => {
    if (ctx.guild === null) throw new Error("Command must be run in a server.");
    if (ctx.channel === null || !("name" in ctx.channel)) throw new Error("Command must be run in a valid channel.");

    let announceChannelId = opts.channel.get("channel")?.id ?? fetchConfigOption(ctx.db, "server", "announcements", ctx.guild.id);
    //autocomplete suggested this why. this looks awful. what is this. ig its compact tho
    announceChannelId ??= ctx.channel.id;

    if (typeof announceChannelId !== "string")
      throw new Error("No announcement channel provided, or provided data was not a channel ID.");

    const announceChannel = ctx.guild.channels.cache.get(announceChannelId);

    if (announceChannel === undefined) 
      throw new Error("Provided ID could not be located. Ensure the requested channel exists in this server.");

    if (!("send" in announceChannel)) 
      throw new Error("Provided channel does not support sent messages.");

    const announceEmbed = new EmbedBuilder()
      .setTitle(`${ctx.channel.name ?? "undefined"}'s Announcement`)
      .setDescription(opts.string.get("message") ?? "undefined")
      .setAuthor({ name: ctx.user.username, iconURL: ctx.user.displayAvatarURL() })
      .setColor(0xAA00FF)
      .setTimestamp(ctx.timestamp);

    announceChannel.send({ embeds: [announceEmbed] })
      .then(async () => {
        await ctx.reply("Announcement sent!");
      }).catch(() => {
        throw new Error("Announcement could not be sent. Ensure permissions aren't restricted for the provided channel."); 
      });
  },
});

export default Announce;
