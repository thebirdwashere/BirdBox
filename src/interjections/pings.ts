import { Interjection } from "src/utility/interjection.js";
import ping_responses from "src/data/ping_responses.json" with { type: "json" };
import { ResponsesList } from "src/utility/types.js";
import { randomChoice } from "src/utility/utility.js";

const RESPONSES = ping_responses as ResponsesList;

const Pings = new Interjection({
  name: "pings",
  test: async (ctx) => {
    if (ctx.message.content.includes(`<@${ctx.data.id}>`)) {
      const randomReply = randomChoice(RESPONSES);
      await ctx.reply(randomReply);
      return true;
    }

    return false;
  }
});

export default Pings;