import { Interjection, notifyOfInterjection } from "src/utility/interjection.js";
import { randomChoice } from "src/utility/utility.js";
import footers from "src/data/footers.json" with { type: "json" };
import { Footers } from "src/utility/types.js";

const FOOTERS = footers as Footers;

const Pangram = new Interjection({
  name: "pangrams",
  test: async (ctx) => {
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

    const pangramString = capitalizedContent.join("");
    await ctx.reply(`:capital_abcd: Your message contains every letter in the alphabet! \n\`${pangramString}\``);

    const randomFooter = randomChoice(FOOTERS.pangrams);
        
    await notifyOfInterjection(ctx, {
      "color": 0x3b88c3,
      "description": "contains every letter in the alphabet",
      "displayString": pangramString,
      "emoji": ":capital_abcd:",
      "footer": randomFooter,
    });
  }
});

export default Pangram;