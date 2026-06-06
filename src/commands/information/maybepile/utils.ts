import { AutocompleteContext } from "@src/utility/context.js";
import { Database } from "@src/utility/database.js";
import { MaybepileArray } from "@src/utility/types.js";

export async function maybepileAutocomplete(ctx: AutocompleteContext): Promise<void> {
  const pileArray = ctx.db.global.fetchOr("global", "maybepile", ["Table of Contents"]) as MaybepileArray;
  const returnOptions = pileArray.map((item, index) => {
    const itemName = typeof item === "string" ? item : item.title;
    return { 
      name: `${index.toString()}: ${itemName}`, 
      value: index.toString()
    };
  });

  await ctx.respond(returnOptions);
}
export function getPageNumber(pileArray: MaybepileArray, pageSelection: string): number {
  let pageNum;

  if (Number.isNaN(Number(pageSelection))) {
    const newIndex = pileArray.findIndex(item => (typeof item !== "string" ? item.title === pageSelection : item === pageSelection));
    if (newIndex === -1)
      throw new Error("Unable to find the requested item.");
    else
      pageNum = newIndex;
  } else {
    pageNum = Number(pageSelection);
  }

  return pageNum;
}

export function getMaybepile(db: Database): MaybepileArray {
  return db.global.fetchOr("global", "maybepile", ["Table of Contents"]) as MaybepileArray;
}

export function updateMaybepile(db: Database, newData: MaybepileArray): void {
  db.global.update("global", "maybepile", newData);
}