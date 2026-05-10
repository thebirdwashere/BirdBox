import { Command, CommandOption } from "src/utility/command.js";

const Test = new Command({
  name: "test",
  description: "Testing Bislij's system.",
  options: [
    new CommandOption({
      name: "stringtest",
      description: "a string with min and max length",
      type: "string",
      optional: true,
      length: [10, 20],
    }),
    new CommandOption({
      name: "choicestest",
      description: "a string with choice options",
      type: "string",
      optional: true,
      choices: ["red", "green", "blue"],
    }),
    new CommandOption({
      name: "numbertest",
      description: "a number",
      type: "number",
      optional: true,
    }),
    new CommandOption({
      name: "booleantest",
      description: "a boolean",
      type: "boolean",
      optional: true,
    }),
    new CommandOption({
      name: "usertest",
      description: "a user",
      type: "user",
      optional: true,
    }),
    new CommandOption({
      name: "roletest",
      description: "a role",
      type: "role",
      optional: true,
    }),
    new CommandOption({
      name: "mentionabletest",
      description: "a mentionable",
      type: "mentionable",
      optional: true,
    }),
    new CommandOption({
      name: "channeltest",
      description: "a channel",
      type: "channel",
      optional: true,
    }),
  ],
  execute: async (ctx, opts) => {
    await ctx.send(opts.string.get("stringtest")?.toString() ?? "undefined");
    await ctx.send(opts.string.get("choicestest")?.toString() ?? "undefined");
    await ctx.send(opts.number.get("numbertest")?.toString() ?? "undefined");
    await ctx.send(opts.boolean.get("booleantest")?.toString() ?? "undefined");
    await ctx.send(opts.user.get("usertest")?.username ?? "undefined");
    await ctx.send(opts.role.get("roletest")?.name ?? "undefined");

    const mentionable = opts.mentionable.get("mentionabletest");
    if (mentionable == null) {
      await ctx.send("undefined");
    } else if ("username" in mentionable) {
      await ctx.send(`<@${mentionable.id.toString()}>`);
    } else if ("name" in mentionable) {
      await ctx.send(`<@&${mentionable.id.toString()}>`);
    }

    const channel = opts.channel.get("channeltest");
    if (channel == null) {
      await ctx.send("undefined");
    } else {
      await ctx.send(`<#${channel.id.toString()}>` );
    }
  },
});

export default Test;
