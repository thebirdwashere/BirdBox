import { Command } from "src/utility/command.js";

const Ping = new Command({
  name: "ping",
  description: "Pings the bot and returns the response.",
  execute: async (ctx) => {
    await ctx.reply("Pong!");
  },
});

export default Ping;
