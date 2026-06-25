import { Subcommand, CommandOption } from "@src/utility/command.js";
import wordle from "@src/data/wordle.json" with { type: "json" };
import { Wordle, WordleGameFields } from "@src/utility/types.js";
import { randomChoice } from "@src/utility/utility.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, Message } from "discord.js";
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

    const code = opts.string.getOptional("code");
    const moreSolutions = opts.string.getOptional("solutions") ?? "curated";

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
    await ctx.reply({embeds: [wordleEmbed], components: [wordleActionRow]});

    ctx.collectInteractions({
      type: ComponentType.Button,
      timeLimit: 60_000,
      onInteraction,
      onTimeout,
    });

    async function onInteraction(msg: Message, i: ButtonInteraction): Promise<void> {
      const keyboardText = handleUsedLettersDisplay(gameFields);
      await i.reply({content: keyboardText});
      await onTimeout(msg);
    }

    async function onTimeout(msg: Message): Promise<void> {
      wordleActionRow.components[0].setDisabled(true);
      await msg.edit({ components: [wordleActionRow] });
    }

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
