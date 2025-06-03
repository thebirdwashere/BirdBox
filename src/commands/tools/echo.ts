import { Command, CommandOption } from "src/utility/command.js";

const Echo = new Command({
  name: "echo",
  description: "Pings the bot and returns the response.",
  options: [
    new CommandOption({
      name: "message",
      description: "the message you want the bot to respond with",
      type: "string",
    }),
  ],
  execute: async (ctx, opts) => {
    const message = opts.string.get("message");
    if (message === undefined || message === null)
      throw new Error("Could not retrieve message.");

    await ctx.reply(message);
  },
});

export default Echo;
