import { Command } from "@src/utility/command.js";
import { exec } from "node:child_process";
import { sleep } from "@src/utility/utility.js";

const Neofetch = new Command({
  name: "neofetch",
  description: "Runs neofetch on the server that the bot is hosted on.",
  execute: async (ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    exec("neofetch --stdout", async (_, stdout, stderr) => {
      if (stderr) {
        await ctx.reply(`Error running neofetch: \`${String(stderr)}\``);
        return;
      }

      await ctx.reply(`\`\`\`\n${stdout}\n\`\`\``);
    });

    await sleep(1);
  },
});

export default Neofetch;
