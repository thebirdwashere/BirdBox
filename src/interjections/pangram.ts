import { MessageContext } from "src/utility/context.js";
import { Interjection, InterjectionState } from "../utility/interjection.js";

const Pangram = new Interjection({
  name: "pangrams",
  test: (ctx: MessageContext) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    const content = ctx.message.content.toLowerCase();

    if (content.length > 950) return; //this checks if the message is empty or too long
    if (content.includes("https://")) return; //this checks for contained links (which trivialize detection)
    
    const capitalizedContent = content.split("");
    for (const letter of alphabet) {
      if (!content.includes(letter)) return;
      const letterIndex = content.indexOf(letter);
      capitalizedContent[letterIndex] = capitalizedContent[letterIndex].toUpperCase();
    }

    return { text: [capitalizedContent.join("")] };
  },
  respond: async (ctx: MessageContext, state: InterjectionState) => {
    if (state.text === undefined)
      throw new Error ("No text passed to pangram interjection.");

    await ctx.reply(`:capital_abcd: Your message contains every letter in the alphabet! \n\`${state.text[0]}\``);
  },
});

export default Pangram;