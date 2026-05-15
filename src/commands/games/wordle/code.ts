import { Subcommand, CommandOption } from "src/utility/command.js";
import { encryptWordCode } from "./utils.js";

const WordleCode = new Subcommand({
  name: "code",
  description: "Get the code for a word to share it with others.",
  options: [
    new CommandOption({
      name: "word",
      description: "The word you want to encrypt.",
      type: "string",
    }),
  ],
  execute: async (ctx, opts) => { //MARK: game setup
    const word = opts.string.get("word")?.replaceAll(/[^a-zA-Z]+/g, "");

    if (word == null) {
      throw new Error("Error locating provided word.");
    }

    //any 5 letter string works, even ones not in the json
    if (word.length !== 5) {
      await ctx.reply("bruh we need a 5 letter word for wordle");
      return;
    }

    //get the word code (duh)
    const encryptedCode = encryptWordCode(word.toLowerCase());

    //tell em what the code is
    const responseText = `The Wordle code for your provided word is \`${encryptedCode}\`. \nUse \`${ctx.prefix}wordle start\` to play your custom game!`;
    await ctx.reply(responseText);
  },
});

export default WordleCode;
