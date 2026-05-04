import { MessageContext } from "src/utility/context.js";
import { Interjection, InterjectionState } from "../utility/interjection.js";
import ping_responses from "../data/ping_responses.json" with { type: "json" };
import { PingResponses } from "src/utility/types.js";

const RESPONSES = ping_responses as PingResponses;

const Pings = new Interjection({
  name: "pings",
  test: (ctx: MessageContext) => {
    if (ctx.message.content.includes(`<@${ctx.data.id}>`)) {
      const randomReply = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
      return { text: [randomReply] };
    }
  },
  respond: async (ctx: MessageContext, state: InterjectionState) => {
    if (state.text === undefined)
      throw new Error ("Expected text for interjection.");

    await ctx.reply(state.text[0]);
  },
});

export default Pings;