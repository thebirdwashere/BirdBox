import { Interjection, notifyOfInterjection } from "src/utility/interjection.js";
import { randomChoice } from "src/utility/utility.js";
import footers from "src/data/footers.json" with { type: "json" };
import { Footers } from "src/utility/types.js";

const FOOTERS = footers as Footers;

const FILTER_REGEX = /[^a-z]/g;
const MIN_CHAR_LENGTH = 10;
const MIN_UNIQUE_LETTERS = 5;

const Palindrome = new Interjection({
  name: "palindromes",
  test: async (ctx) => {
    const content = ctx.message.content
      .toLowerCase()
      .replaceAll(FILTER_REGEX, "");

    if (content.length && content.length > 1935) return false; //message is too long for embeds

    if (content.length < MIN_CHAR_LENGTH) return false;
    
    const contentLetters = content.split("");

    if (new Set(contentLetters).size < MIN_UNIQUE_LETTERS) return false;

    let frontPointer = 0;
    let backPointer = contentLetters.length - 1;

    while (frontPointer < backPointer) {
      if (contentLetters[frontPointer] !== contentLetters[backPointer]) return false;
      frontPointer++; backPointer--;
    }

    const reversedContent = ctx.message.content.split("").reverse().join("");

    await ctx.reply(`:left_right_arrow: Your message is a palindrome! \n\`${reversedContent}\``);

    //get the random footer for the embed
    const randomFooter = randomChoice(FOOTERS.palindromes);
    
    await notifyOfInterjection(ctx, {
      "color": 0x3b88c3,
      "description": "is a palindrome",
      "displayString": reversedContent,
      "emoji": ":left_right_arrow:",
      "footer": randomFooter,
    });

    return true;
  }
});

export default Palindrome;