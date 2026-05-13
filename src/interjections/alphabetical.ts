import { Interjection, notifyOfInterjection } from "src/utility/interjection.js";
import { randomChoice } from "src/utility/utility.js";
import footers from "src/data/footers.json" with { type: "json" };
import { Footers } from "src/utility/types.js";

const FOOTERS = footers as Footers;

const MIN_WORD_LENGTH = 5;

const Alphabetical = new Interjection({
  name: "alphabetical order",
  test: async (ctx) => {
    const content = ctx.message.content.toLowerCase();

    if (content.length > 1935) return false;       //message is too long for embeds
    if (/[^a-zA-Z\s]/.test(content)) return false; //check for non-alphabetic characters

    const splitContent = content.split(" ").filter(word => word !== "");
    
    if (splitContent.length < MIN_WORD_LENGTH) return false;                //stop if less than 5 words
    if (splitContent.some(word => word.startsWith(":"))) return false;      //stop if any emojis
    if ((new Set(splitContent)).size !== splitContent.length) return false; //stop if any duplicate words
    
    //sort content alphabetically
    const sortedContent = [...splitContent].sort(); 

    //if the sorted content is the same, logically,
    //the original message was in alphabetical order
    if (splitContent.join(" ") !== sortedContent.join(" ")) return false;

    //capitalize each first letter
    const responseWords = splitContent.map(word => {return word[0].toUpperCase() + word.substring(1);});
    const responseText = responseWords.join(" ");
    await ctx.reply(`:abc: Your message is in perfect alphabetical order! \n\`${responseText}\``);

    //get the random footer for the embed
    const randomWord = randomChoice(responseWords);
    const randomLetter = randomWord[0].toUpperCase();
    const randomFooter = randomChoice(FOOTERS.alphabetical)
      .replace("[[RANDOMWORD]]", randomWord)
      .replace("[[RANDOMLETTER]]", randomLetter);
    
    await notifyOfInterjection(ctx, {
      "color": 0x3b88c3,
      "description": "is in perfect alphabetical order",
      "displayString": responseText,
      "emoji": ":abc:",
      "footer": randomFooter,
    });

    return true;
  }
});

export default Alphabetical;