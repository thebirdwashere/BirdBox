import { Subcommand, CommandOption } from "@src/utility/command.js";
import { getMaybepile, updateMaybepile } from "./utils.js";

const MaybepileSuggest = new Subcommand({
  name: "suggest",
  description: "Create an item of your own!",
  options: [
    new CommandOption({
      name: "title",
      description: "Should be a short identifier for the idea.",
      type: "string",
    }),
    new CommandOption({
      name: "description",
      description: "A longer and clearer description of your idea. Helpful for developers to interpret correctly.",
      type: "string",
    }),
    new CommandOption({
      name: "suggester",
      description: "If not set, defaults to yourself.",
      type: "user",
      optional: true,
    }),
  ],
  cooldown: 300_000,
  execute: async (ctx, opts) => {
    const title = opts.string.getRequired("title");
    const description = opts.string.getRequired("description");
    const suggester = opts.user.getOptional("suggester")?.username ?? ctx.user.username;
  
    const pileArray = getMaybepile(ctx.db);

    pileArray.push({title, description, suggester, claim: {status: "unclaimed"}});
    updateMaybepile(ctx.db, pileArray);

    await ctx.reply({content: `"${title}" has been added to the maybepile!`});
  },
});

export default MaybepileSuggest;
