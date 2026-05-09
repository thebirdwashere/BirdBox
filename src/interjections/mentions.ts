import { MessageContext } from "src/utility/context.js";
import { Interjection } from "src/utility/interjection.js";
import mention_emojis from "src/data/mention_emojis.json" with { type: "json" };
import { ResponsesList } from "src/utility/types.js";
import { randomChoice } from "src/utility/utility.js";

const RESPONSES = mention_emojis as ResponsesList;

const Mentions = new Interjection({
  name: "mentions",
  test: async (ctx: MessageContext) => {
    if (ctx.message.content.toLowerCase().includes("birdbox")) {
      const response = randomChoice(RESPONSES);
      await ctx.message.react(response);
    }
  }
});

export default Mentions;