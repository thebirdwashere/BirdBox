import { Interjection } from "src/utility/interjection.js";

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

    await ctx.reply(`:capital_abcd: Your message contains every letter in the alphabet! \n\`${capitalizedContent.join("")}\``);
  }
});

export default Pangram;