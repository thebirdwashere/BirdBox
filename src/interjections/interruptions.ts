import { MessageContext } from "src/utility/context.js";
import { Interjection, InterjectionState } from "../utility/interjection.js";
import interruptions from "../data/interruptions.json" with { type: "json" };
import { ResponsesList } from "src/utility/types.js";

const RESPONSES = interruptions as ResponsesList;

const CHANCE_OF_INTERRUPTING = 1000;

const Interruptions = new Interjection({
  name: "interruptions",
  test: (ctx: MessageContext) => {
    const randomInt = Math.floor(Math.random() * CHANCE_OF_INTERRUPTING) + 1;

    if (randomInt == CHANCE_OF_INTERRUPTING) {
      const randomInterruption = RESPONSES[Math.floor(Math.random() * interruptions.length)];
      const response = randomInterruption.replace("(userPing)", `<@${ctx.user.id}>`);
      return {
        text: [response]
      };
    }
  },
  respond: async (ctx: MessageContext, state: InterjectionState) => {
    if (state.text === undefined)
      throw new Error ("Expected text for interjection.");

    await ctx.send(state.text[0]);
  },
});

export default Interruptions;