import { Command, CommandOption } from "src/utility/command.js";

const Echo = new Command({
  name: "echo",
  description: "BirdBox replicates a custom message. Not too useful, but certainly fun!",
  options: [
    new CommandOption({
      name: "message",
      description: "The message to echo.",
      type: "string",
    }),
  ],
  execute: async (ctx, opts) => {
    const message = opts.string.get("message");
    if (message == null) throw new Error("Could not retrieve message.");

    await ctx.reply(message);
  },
});

export default Echo;
