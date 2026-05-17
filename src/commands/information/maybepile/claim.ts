import { Subcommand, CommandOption } from "@src/utility/command.js";
import { getMaybepile, getPageNumber, maybepileAutocomplete, updateMaybepile } from "./utils.js";
import { getAdminIds } from "@src/utility/utility.js";

const MaybepileClaim = new Subcommand({
  name: "claim",
  description: "Claim an item, if you plan to contribute!",
  options: [
    new CommandOption({
      name: "item",
      description: "The item you want to claim.",
      type: "string",
      autocomplete: true,
    }),
    new CommandOption({
      name: "status",
      description: "The status of your claimed item. Defaults to \"claimed\" if not set.",
      type: "string",
      optional: true,
      choices: ["claimed", "in development", "deprioritized", "unclaimed"],
    }),
  ],
  autocomplete: maybepileAutocomplete,
  execute: async (ctx, opts) => {
    const itemSelection = opts.string.get("item");
    if (itemSelection == null)
      throw new Error("Unable to locate item number.");

    const pileArray = getMaybepile(ctx.db);

    const itemNum = getPageNumber(pileArray, itemSelection);

    const claimStatus = opts.string.get("status") ?? "claimed";

    const claimedItem = pileArray.at(itemNum);
    if (claimedItem == undefined) {
      await ctx.reply("bruh try claiming an actual item");
      return;
    } else if (claimedItem === "Table of Contents") {
      await ctx.reply("bruh you can't claim the table of contents lol");
      return;
    }

    const claimerNotDev = !getAdminIds().includes(ctx.user.id);

    if (claimedItem.claim.status === "claimed" && ctx.user.id !== claimedItem.claim.id && claimerNotDev) {
      await ctx.reply({content: "sorry, that's already been claimed"});
      return;
    }

    const updatedItem = claimedItem;

    switch (claimStatus) {
    case "claim": {
      claimedItem.claim = {
        status: "claimed",
        user: ctx.user.username,
        id: ctx.user.id,
      };
      await ctx.reply(`${ctx.user.username} has claimed "${claimedItem.title}"!`);

      break;
    }
    case "in development": {
      claimedItem.claim = {
        status: "in development",
        user: ctx.user.username,
        id: ctx.user.id,
      };
      await ctx.reply(`${ctx.user.username} has started work on "${claimedItem.title}"!`);

      break;
    }
    case "deprioritized": {
      claimedItem.claim = {
        status: "deprioritized"
      };
      await ctx.reply(`${ctx.user.username} has deprioritzed "${claimedItem.title}"!`);

      break;
    }
    case "unclaimed": {
      claimedItem.claim = {
        status: "unclaimed"
      };
      await ctx.reply(`${ctx.user.username} has unclaimed **${claimedItem.title}**!`);

      break;
    }
    }

    pileArray[itemNum] = updatedItem;

    updateMaybepile(ctx.db, pileArray);
  },
});

export default MaybepileClaim;
