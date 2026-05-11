import { Subcommand, CommandOption } from "src/utility/command.js";
import wordle from "src/data/wordle.json" with { type: "json" };
import { Wordle, WordleGameFields } from "src/utility/types.js";
import { randomChoice } from "src/utility/utility.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType } from "discord.js";
import { decryptWordCode, encryptWordCode, createWordleEmbed, handleUsedLettersDisplay } from "./utils.js";

const WORDLE = wordle as Wordle;

const WordleStart = new Subcommand({
  name: "start",
  description: "Start a new Wordle game.",
  options: [
    new CommandOption({
      name: "code",
      description: "Use a code from a friend to guess a specific word.",
      type: "string",
      optional: true,
    }),
    new CommandOption({
      name: "solutions",
      description: "Allow for every valid guess to be a possible answer, rather than just the curated list of solutions.",
      type: "string",
      optional: true,
      choices: ["curated", "all"],
    }),
  ],
  execute: async (ctx, opts) => {
    const activeGame = ctx.db.user.fetchOrUndefined(ctx.user.id, "activeWordle");
    if (activeGame !== undefined) {
      await ctx.reply({content: "wait up bro, try finishing your current game before starting a new one"});
      return;
    }

    const code = opts.string.get("code");
    const moreSolutions = opts.string.get("solutions") ?? "curated";

    //do some checking that the code is valid
    const codeRegex = /^[0-9A-F]{10}$/i;
    if (code && !codeRegex.test(code)) {
      await ctx.reply({content: "what kinda code is that, use the code subcommand to get a valid one lol"});
      return;
    }

    //get the solution and its code form
    let solutionWord: string;
    if (code) {
      solutionWord = decryptWordCode(code);
    } else {
      solutionWord = moreSolutions === "curated" ? randomChoice(WORDLE.solutions) : randomChoice(WORDLE.guesses);
    }

    const encryptedSolution = encryptWordCode(solutionWord);

    //initalize the number of guesses thus far
    const guesses = 0;

    //create the wordle box data
    const emptyBoxRow = ["🔲", "🔲", "🔲", "🔲", "🔲"];
    const gameFields: WordleGameFields = [
      {boxes: emptyBoxRow, word: ""},
      {boxes: emptyBoxRow, word: ""},
      {boxes: emptyBoxRow, word: ""},
      {boxes: emptyBoxRow, word: ""},
      {boxes: emptyBoxRow, word: ""},
      {boxes: emptyBoxRow, word: ""}
    ];

    //create embed
    const wordleEmbed = createWordleEmbed(guesses, encryptedSolution, gameFields);

    //create button to see used letters thus far
    const usedLettersButton = new ButtonBuilder()
      .setCustomId("wordle-used-letters")
      .setLabel("See Used Letters")
      .setStyle(ButtonStyle.Secondary);
        
    const wordleActionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(usedLettersButton);
                
    //send message
    const response = await ctx.reply({embeds: [wordleEmbed], components: [wordleActionRow]});

    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      const keyboardText = handleUsedLettersDisplay(gameFields);
      await i.reply({content: keyboardText});
      await disableButton();
    }

    async function disableButton(): Promise<void> {
      //disable the button
      wordleActionRow.components[0].setDisabled(true);
      await response.edit({ components: [wordleActionRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i) => {await handleButtonInteraction(i);});
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async (_) => {await disableButton();});

    //set wordle data in the database
    ctx.db.user.update(ctx.user.id, "activeWordle", {
      solution: solutionWord, 
      guesses: guesses,
      fields: gameFields,
      usedCode: !!code //this is somehow the recommended way to convert to a bool lol
    });
  },
});

export default WordleStart;
