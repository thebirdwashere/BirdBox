import { Command, CommandOption } from "src/utility/command.js";
import { EmbedBuilder } from "discord.js";

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
            description: "A link to the channel announced to. If not set, defaults to server-configured default channel.",
            type: "string",
            required: false,
        }),
    ],
    // eslint-disable-next-line @typescript-eslint/require-await
    execute: async (ctx, opts) => {
        if (ctx.guild === null) throw new Error("Command must be run in a server.");
        if (ctx.channel === null || !("name" in ctx.channel)) throw new Error("Command must be run in a valid channel.");

        const announce_channel_id = opts.string.get("channel")?.replace(`https://discord.com/channels/${ctx.guild.id}/`, "") /*?? await getSettingValue(`settings.announce_channel.${message.guildId}`, db) ?? message.channelId*/;

        if (announce_channel_id === undefined) throw new Error("Announcement channel ID could not be found.");

        const announce_channel = ctx.guild.channels.cache.get(announce_channel_id);

        if (announce_channel === undefined) throw new Error("Provided ID could not be located. Ensure the requested channel exists in this server.");
        if (!("send" in announce_channel)) throw new Error("Provided channel does not support sent messages.");

        const announceEmbed = new EmbedBuilder()
            .setTitle(`${ctx.channel.name ?? "undefined"}'s Announcement`)
            .setDescription(opts.string.get("message") ?? "undefined")
            .setAuthor({ name: ctx.user.username, iconURL: ctx.user.displayAvatarURL() })
            .setColor(0xAA00FF)
            .setTimestamp(ctx.timestamp);

        announce_channel.send({ embeds: [announceEmbed] })
            .then(async () => {
                await ctx.reply("Announcement sent!");
            }).catch(() => {
                throw new Error("Announcement could not be sent. Ensure permissions aren't restricted for the provided channel."); 
            });
    }
});

export default Announce;
