import { MessageContext } from "src/utility/context.js";
import { Interjection, InterjectionState } from "../utility/interjection.js";
import keywords from "../data/keywords.json" with { type: "json" };
import { Keywords } from "src/utility/types.js";

const KEYWORDS = keywords as Keywords;

const Pangram = new Interjection({
  name: "keywords",
  test: (ctx: MessageContext) => {
    //filter and get message content for detection
    const filterRegex = /[^A-Za-z\s!?]/g;
    const content = ctx.message.content.toLowerCase().replace(filterRegex,"").trim();

    //get keyword-type responses and sort by length
    const keywordsMap = new Map([...new Map(Object.entries(KEYWORDS))].sort((a, b) => a[1].length - b[1].length));

    //test for keyword-type responses
    for (const [key, val] of keywordsMap) {
      if (content.includes(key)) {
        return { text: [val] };
      }
    }
  },
  respond: async (ctx: MessageContext, state: InterjectionState) => {
    if (state.text === undefined)
      throw new Error ("Expected text for interjection.");

    await ctx.reply(state.text[0]);
  },
});

export default Pangram;