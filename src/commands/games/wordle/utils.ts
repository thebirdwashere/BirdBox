import { Colors, EmbedBuilder } from "discord.js";
import { WordleGameFields } from "src/utility/types.js";

//for code encryption and decryption (shuffled for the tiniest bit of protection)
const shuffledAlphabet = "rlzwvefuognicapqmytbjksxdh".split("");

export function decryptWordCode(code: string): string {
  //simple regex to get an array of every 2 characters
  const hexCode = code.match(/(.{2})/g);

  //shouldn't happen, but we must banish the squiggly lines
  if (hexCode == null)
    throw new Error(`Failed to parse code \`${code}\`.`);

  const decryptedString = hexCode.reduce((str, num) => {
    //parse the number as its hexadecimal representation
    const decNum = parseInt(num, 16);
    //add the matching letter from the shuffled alphabet
    return str + shuffledAlphabet[decNum];
  }, "");

  return decryptedString;
}


export function encryptWordCode(word: string): string {
  //get each letter of the word
  const splitWord = word.split("");

  const hexWord = splitWord.reduce((hex, letter) => {
    //get letter's position 
    const letterCode = shuffledAlphabet.indexOf(letter);

    //convert letter's position to base 16 (hexadecimal)
    const encryptedLetter = letterCode.toString(16);

    //if the hex representation only needs one char, add a 0 before it
    const paddedEncryptedLetter = ("0" + encryptedLetter).slice(-2);

    return hex + paddedEncryptedLetter;
  }, "");

  return hexWord;
}


export function createWordleEmbed(guesses: number, code: string, fields: WordleGameFields): EmbedBuilder {
  //get embed
  const wordleEmbed = new EmbedBuilder()
    .setTitle("Wordle Game")
    .setColor(Colors.Blue)
    .setFooter({text: `Guess ${guesses.toString()}/6 ● ${code}`});

  //set each row of boxes
  let boxString = "";
  for (const row of fields) {
    boxString += `${row.boxes.join("")} ${row.word}\n`;
  }

  wordleEmbed.setDescription(boxString);

  return wordleEmbed;
}

export function handleUsedLettersDisplay(fields: WordleGameFields): string {
  //inital spacing spacing; estimated by hand but looks fine
  let keyboardTop = "";
  let keyboardMiddle = "     ";
  let keyboardBottom = "                    ";

  //each row of the keyboard and top row
  const keyboardTopEntries = "QWERTYUIOP".split("");
  const keyboardMiddleEntries = "ASDFGHJKL".split("");
  const keyboardBottomEntries = "ZXCVBNM".split("");
  const keyboardLetters = keyboardTopEntries.concat(keyboardMiddleEntries, keyboardBottomEntries);

  //create a map (ooh fancy)
  //a map appears to just be an object that remembers order and can be iterated over
  //future me edit: wow this is where i learned what a map was huh
  const letterStatus = new Map(keyboardLetters.map(letter => [letter, "🔲"]));

  for (const field of fields) {
    for (let num = 0; num < 5; num++) {
      //get each letter in each field and its corresponding box
      const letter = field.word.at(num)?.toUpperCase();
      const newBox = field.boxes[num];

      //get what the box currently is in the map
      const currentBox = letter ? letterStatus.get(letter) : undefined;

      //if the current box is not green, it's fine to overwrite
      //imagine if we overwrote greens for yellows lol
      if (letter && currentBox !== "🟩") {
        letterStatus.set(letter, newBox);
      }
    }
  }

  //add newly created boxes to each string
  for (const [key, val] of letterStatus.entries()) {
    if (keyboardTopEntries.includes(key)) {
      keyboardTop += `${val}${key} `;
    } else if (keyboardMiddleEntries.includes(key)) {
      keyboardMiddle += `${val}${key} `;
    } else if (keyboardBottomEntries.includes(key)) {
      keyboardBottom += `${val}${key} `;
    }
  }

  //create full string
  const keyboardString = `${keyboardTop}\n${keyboardMiddle}\n${keyboardBottom}`;

  return keyboardString;
}

export function getLetterColors(solution: string, guessed: string): string[] {
  //behavior sourced from https://www.reddit.com/r/wordle/comments/ry49ne/illustration_of_what_happens_when_your_guess_has/
  //more or less modified the source code from https://github.com/Hugo0/wordle/blob/main/webapp/static/game.js

  //create blank row
  const colorsArray = ["⬛", "⬛", "⬛", "⬛", "⬛"];

  //get the amount of each letter
  const numberOfEachLetter: Record<string, number> = {};
  for (const letter of solution) {
    //ternary; basically this declares to 1 if not there or adds 1 if it is
    numberOfEachLetter[letter] = numberOfEachLetter[letter] ? numberOfEachLetter[letter] += 1 : 1;
  }

  //color greens
  for (let i = 0; i < solution.length; i++) {
    if (solution[i] == guessed[i]) {
      colorsArray[i] = "🟩";

      //get rid of letter so it doesn't get matched by doubles
      numberOfEachLetter[guessed[i]] -= 1;
    }
  }

  //color yellows
  for (let i = 0; i < solution.length; i++) {
    if (numberOfEachLetter[guessed[i]] && colorsArray[i] == "⬛" /*don't match greens*/) { 
      colorsArray[i] = "🟨";
            
      //get rid of letter so it doesn't get matched by doubles
      numberOfEachLetter[guessed[i]] -= 1;
    }
  }

  return colorsArray;
}
