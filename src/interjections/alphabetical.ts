import { MessageContext } from "src/utility/context.js";
import { Interjection } from "src/utility/interjection.js";

const MIN_WORD_LENGTH = 5;

const Alphabetical = new Interjection({
  name: "alphabetical order",
  test: async (ctx: MessageContext) => {
    const content = ctx.message.content.toLowerCase();

    if (content.length > 1935) return;       //message is too long for embeds
    if (/[^a-zA-Z\s]/.test(content)) return; //check for non-alphabetic characters

    const splitContent = content.split(" ").filter(word => word !== "");
    
    if (splitContent.length < MIN_WORD_LENGTH) return;                //stop if less than 5 words
    if (splitContent.some(word => word.startsWith(":"))) return;      //stop if any emojis
    if ((new Set(splitContent)).size !== splitContent.length) return; //stop if any duplicate words
    
    //sort content alphabetically
    const sortedContent = [...splitContent].sort(); 

    //if the sorted content is the same, logically,
    //the original message was in alphabetical order
    if (splitContent.join(" ") === sortedContent.join(" ")) { 
      //capitalize each first letter
      const response = splitContent.map(word => {return word[0].toUpperCase() + word.substring(1);}).join(" ");
      await ctx.reply(`:abc: Your message is in perfect alphabetical order! \n\`${response}\``);
    };
  }
});

export default Alphabetical;