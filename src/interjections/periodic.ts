import { Interjection, notifyOfInterjection } from "src/utility/interjection.js";
import periodic_table from "src/data/periodic_table.json" with { type: "json" };
import footers from "src/data/footers.json" with { type: "json" };
import { Footers } from "src/utility/types.js";
import { PeriodicTable } from "src/utility/types.js";
import { randomChoice } from "src/utility/utility.js";

const PERIODIC_TABLE = periodic_table as PeriodicTable;
const FOOTERS = footers as Footers;

const FILTER_REGEX = /[^a-z\s]/g;
const MIN_CHAR_LENGTH = 35;
const MIN_UNIQUE_ELEMENTS = 6;

const Periodic = new Interjection({
  name: "periodic table",
  test: async (ctx) => {
    const content = ctx.message.content
      .toLowerCase()
      .replaceAll(FILTER_REGEX, "");

    //this checks if the message is empty or too long
    if (content.length && content.length > 950) return false;
    //no j or q on the periodic table, fun fact
    if (content.includes("j") || content.includes("q")) return false;

    //only test strings with a certain number of characters, for coolness factor
    if (content.length < MIN_CHAR_LENGTH) return false;

    //another fun fact: x only starts a two-letter combo, so cannot end it
    if (content.endsWith("x")) return false;

    //list of clusters that can't happen ever
    for (const item of PERIODIC_TABLE.impossibleStrings) {
      if (content.includes(item)) return false;
    };

    //btw i'm bothering to check this super well because it's going to take a while
    // to get to the end with this algorithm, and figuring out which endings are impossible 
    // is relatively straightforward with another algoritm i made elsewhere.  
    // it's already super fast so i really don't have to do this, but i am bored   
    // on winter break and terrified to push this complicated update

    if (PERIODIC_TABLE.impossibleEndings.includes(content.slice(-2))) return false;    

    //https://stackoverflow.com/questions/6163169/replace-multiple-whitespaces-with-single-whitespace-in-javascript-string
    const cleanContent = content.replaceAll(/\s+/g, " ").trim(); 

    const tableArray = periodicCheck(cleanContent, [], 0);

    if (!tableArray) return false; //ensure a value was returned
    const uniqueItems = [...new Set(tableArray)];

    if (uniqueItems.length < MIN_UNIQUE_ELEMENTS) return false;

    const periodicString = tableArray.join("");
    await ctx.message.reply(`:test_tube: Your message is on the periodic table! \n\`${periodicString}\``);

    const randomFooter = randomChoice(FOOTERS.interjections.periodic.concat(FOOTERS.interjections.generic))
      .replaceAll("[[USERNAME]]", ctx.user.displayName.toLowerCase());
        
    await notifyOfInterjection(ctx, {
      "color": 0x21c369,
      "description": "in on the periodic table",
      "displayString": periodicString,
      "emoji": ":test_tube:",
      "footer": randomFooter,
    });

    return true;
  }
});

export default Periodic;

function periodicCheck(text: string, array: string[], index: number): string[] | null {
  if (text.length <= index) {
    return array;
  }

  if (
    //get out early if twoChar can't be created
    text.length - index === 1 
    && !(PERIODIC_TABLE.ones.includes(text[index].toLowerCase()))
  ) {
    return null;
  }

  const oneChar = text[index];
  const twoChar = text.substring(index, index + 2);

  if (/\s/.test(oneChar)) {
    array.push(oneChar.toUpperCase());
    return periodicCheck(text, [...array], index + 1);
  }

  if (PERIODIC_TABLE.twos.includes(twoChar) && PERIODIC_TABLE.ones.includes(oneChar)) { 
    array.push(twoChar[0].toUpperCase() + twoChar[1]);

    const twoCheck = periodicCheck(text, [...array], index + 2);

    if (twoCheck) {
      return twoCheck;
    } else {
      array.pop(); array.push(oneChar.toUpperCase());
      return periodicCheck(text, [...array], index + 1);
    }

  } else if (PERIODIC_TABLE.twos.includes(twoChar)) { 
    array.push(twoChar[0].toUpperCase() + twoChar[1]);
    return periodicCheck(text, [...array], index + 2);

  } else if (PERIODIC_TABLE.ones.includes(oneChar)) {
    array.push(oneChar.toUpperCase());
    return periodicCheck(text, [...array], index + 1);
  }

  return null;
}