import { Interjection } from "src/utility/interjection.js";
import interruptions from "src/data/interruptions.json" with { type: "json" };
import { ResponsesList } from "src/utility/types.js";
import { randomChoice } from "src/utility/utility.js";

const RESPONSES = interruptions as ResponsesList;

const CHANCE_OF_INTERRUPTING = 1000;

const Interruptions = new Interjection({
  name: "interruptions",
  test: async (ctx) => {
    const randomInt = Math.floor(Math.random() * CHANCE_OF_INTERRUPTING) + 1;

    if (randomInt == CHANCE_OF_INTERRUPTING) {
      const randomInterruption = randomChoice(RESPONSES);
      const response = randomInterruption.replace("(userPing)", `<@${ctx.user.id}>`);
      await ctx.send(response);
    }
  }
});

export default Interruptions;