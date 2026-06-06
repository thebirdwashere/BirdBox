import { Interjection } from "@src/utility/interjection.js";
import keywords from "@src/data/keywords.json" with { type: "json" };
import { Keywords } from "@src/utility/types.js";
import { fetchConfigOption } from "@src/utility/utility.js";

const KEYWORDS = keywords as Keywords;

const FILTER_REGEX = /[^A-Za-z\s!?]/g;

const Pangram = new Interjection({
  name: "keywords",
  test: async (ctx) => {
    if (ctx.guild) {
      const settingValue = await fetchConfigOption(ctx.db, "server", "responses", ctx.guild.id);
      if (!settingValue) return false;
    }
    
    //filter and get message content for detection
    const content = ctx.message.content.toLowerCase().replace(FILTER_REGEX,"").trim();

    //get keyword-type responses and sort by length
    const keywordsMap = new Map([...new Map(Object.entries(KEYWORDS))].sort((a, b) => a[1].length - b[1].length));

    //test for keyword-type responses
    for (const [key, val] of keywordsMap) {
      if (content.includes(key)) {
        await ctx.reply(val);
        return true;
      }
    }
    
    return false;
  }
});

export default Pangram;