import { Subcommand } from "src/utility/command.js";

const flagsStats = new Subcommand({
  name: "stats",
  description: "flags stats",
  execute: async (ctx) => {
    await ctx.reply("TEST");
  },
});

export default flagsStats;
