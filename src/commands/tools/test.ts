import { Command, CommandOption } from "src/utility/command.js";

const Test = new Command({
  name: "test",
  description: "Testing Bislij's system.",
  options: [
    new CommandOption({
      name: "test1",
      description: "a string",
      type: "string",
    }),
    new CommandOption({
      name: "test2",
      description: "a number",
      type: "number",
    }),
    new CommandOption({
      name: "test3",
      description: "a boolean",
      type: "boolean",
    }),
  ],
  execute: async (ctx, opts) => {
    await ctx.send(opts.string.get("test1")?.toString() ?? "undefined");
    await ctx.send(opts.number.get("test2")?.toString() ?? "undefined");
    await ctx.send(opts.boolean.get("test3")?.toString() ?? "undefined");
  },
});

export default Test;
