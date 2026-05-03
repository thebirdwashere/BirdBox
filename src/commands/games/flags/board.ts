import { Subcommand } from "src/utility/command.js";

const flagsBoard = new Subcommand({
  name: "board",
  description: "flags board",
  execute: async (ctx) => {
    await ctx.reply("TEST");
  },
});

export default flagsBoard;
