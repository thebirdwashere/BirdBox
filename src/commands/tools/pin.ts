import { GuildBasedChannel, Message, Snowflake, TextBasedChannel } from "discord.js";
import { Command, CommandOption } from "src/utility/command.js";
import { MessageContext } from "src/utility/context.js";

const Pin = new Command({
    name: "pin",
    description: "Pin/unpin a message by link. May be disabled depending on config.",
    options: [
        new CommandOption({
            name: "link",
            description: "The message link to pin. If not provided, will attempt to pin the message replied to.",
            type: "string",
            required: false,
        }),
    ],
    execute: async (ctx, opts) => {
        const perms = ctx.data.perms;
        const admins = Object.values(perms.developer).concat(Object.values(perms.host));
        
        if (ctx.guild === null) throw new Error("Command must be run in a server.");

        const providedLink = opts.string.get("link");
        const [targetChannelId, targetMessageId] = opts.string.get("link")?.replace(`https://discord.com/channels/${ctx.guild.id}/`, "").split("/") ?? ["0", "0"];

        let targetChannel: GuildBasedChannel | TextBasedChannel | null, targetMessage;
        if (providedLink !== null && providedLink !== undefined) {
            targetChannel = await ctx.guild.channels.fetch(targetChannelId);
            if (targetChannel === null) throw new Error("Unable to locate provided channel.");
            if (!("messages" in targetChannel)) throw new Error("Provided channel cannot hold messages.");

            targetMessage = await targetChannel.messages.fetch(targetMessageId);
            if (!(targetMessage instanceof Message)) throw new Error("Unable to locate provided message.");
        } else if (ctx instanceof MessageContext) {
            targetChannel = ctx.channel;
            if (targetChannel === null) throw new Error("Command run in an invalid channel.");

            try {
                targetMessage = await ctx.message.fetchReference();
            } catch (_) {
                throw new Error("Message reply not found.");
            }

            if (!("id" in targetMessage)) throw new Error("Replied message not found.");
        } else {
            throw new Error("No message provided, either by link or reply.");
        }

        const channelOwner: Snowflake | null = "ownerId" in targetChannel ? targetChannel.ownerId : null;
        const interactionUser: Snowflake | null = "id" in ctx.user ? ctx.user.id.toString() : null;
        const userIsAdmin = admins.includes(interactionUser ?? "undefined"); //admins get bypass on any check

        // const pinSetting = await getSettingValue(`settings.pinning.${interaction.guildId}`, db)
        // const anyoneCanPin = pinSetting == "everyone";
        // const nobodyCanPin = pinSetting == "nobody";

        // if (nobodyCanPin) return interaction.reply({ content: "sorry, the admins disabled pin functions in this server", ephemeral: true });
        
        if (!targetMessage.pinned) {

            //if it's a thread
            if (/*!anyoneCanPin &&*/ !userIsAdmin && channelOwner !== null && channelOwner !== interactionUser) {
                throw new Error("Messages in threads must be pinned by thread owner.");
            }

            await targetMessage.pin();
            await ctx.reply("Pinned successfully!");

        } else { //if it's already pinned

            //if it's a thread
            if (/*!anyoneCanPin &&*/ !userIsAdmin && channelOwner !== null && channelOwner !== interactionUser) {
                throw new Error("Messages in threads must be unpinned by thread owner.");
            }
            //if it's not a thread
            if (/*!anyoneCanPin &&*/ !userIsAdmin && !channelOwner) { 
                throw new Error("Messages cannot be unpinned in the provided channel.");
            }

            await targetMessage.unpin();

            if (targetMessage.content) {
                const targetMessageContent = targetMessage.content.replace("\n", " ");
                const maxMessageLength = 50;
                await ctx.reply(`\`${(targetMessageContent.length > maxMessageLength ? `${targetMessageContent.substring(0, maxMessageLength)}...` : targetMessageContent)}\` unpinned successfully!`);
            } else {
                await ctx.reply("Unpinned successfully!");
            }
        }
    },
});

export default Pin;
