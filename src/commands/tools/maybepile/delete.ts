import { Subcommand, CommandOption } from "src/utility/command.js";
import { getMaybepile, getPageNumber, maybepileAutocomplete, updateMaybepile } from "./utils.js";

const MaybepileDelete = new Subcommand({
  name: "delete",
  description: "Delete an existing item. Irreversible, so be careful!",
  options: [
    new CommandOption({
      name: "item",
      description: "The item to be deleted.",
      type: "string",
      autocomplete: true,
    }),
  ],
  permissions: ["host", "developer"],
  autocomplete: maybepileAutocomplete,
  execute: async (ctx, opts) => {
    const itemSelection = opts.string.get("item");
    if (itemSelection == null)
      throw new Error("Unable to locate item number.");

    const pileArray = getMaybepile(ctx.db);

    const itemNum = getPageNumber(pileArray, itemSelection);

    const originalItem = pileArray.at(itemNum);
    if (originalItem == undefined) {
      await ctx.reply("bruh try deleting an actual item");
      return;
    } else if (originalItem === "Table of Contents") {
      await ctx.reply("bruh you can't delete the table of contents lol");
      return;
    }

    pileArray.splice(itemNum, 1);
    updateMaybepile(ctx.db, pileArray);

    await ctx.reply({content: `"${originalItem.title}" has been deleted from the maybepile!`});
  },
});

export default MaybepileDelete;
