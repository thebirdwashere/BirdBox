import { Subcommand, CommandOption } from "@src/utility/command.js";
import wordle from "@src/data/wordle.json" with { type: "json" };
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";
import { Wordle, WordleGameData, WordleGameFields, WordleGuessNum, UserWordleStats } from "@src/utility/types.js";
import { encryptWordCode, createWordleEmbed, handleUsedLettersDisplay, getLetterColors } from "./utils.js";

const WORDLE = wordle as Wordle;

const WordleGuess = new Subcommand({
  name: "guess",
  description: "Given a country, guess its flag.",
  options: [
    new CommandOption({
      name: "word",
      description: "The word you want to guess.",
      type: "string",
      autocomplete: true,
    }),
  ],
  autocomplete: async (ctx) => { //MARK: autocomplete
    const currentGuess = ctx.option.value.toLowerCase();

    const currentSession = ctx.db.user.fetchOrUndefined(ctx.user.id, "activeWordle") as WordleGameData | undefined;

    if (currentSession === undefined) {
      await ctx.respondMessage("hold your horses bro, try starting a game first");
      return;
    }

    if (!currentGuess) {
      await ctx.respondMessage("well hurry up and guess, i aint got all day");
      return;
    }

    const solutionWord = currentSession.solution;

    const wordValid = WORDLE.guesses.includes(currentGuess);
    const wordCorrect = currentGuess === solutionWord;

    if (wordValid || wordCorrect) {
      await ctx.respondMessage(currentGuess);
    } else {
      await ctx.respondMessage(`ain't no way bro's tryna guess "${currentGuess}", try something else bruh`);
    }
  },
  execute: async (ctx, opts) => { //MARK: game setup
    const currentSession = ctx.db.user.fetchOrUndefined(ctx.user.id, "activeWordle") as WordleGameData | undefined;

    if (currentSession === undefined) {
      await ctx.reply("how bout you start a game before trying to guess lol");
      return;
    }
                
    //get guess and set to lower case
    const guess = opts.string.get("word")?.toLowerCase();

    if (guess === undefined)
      throw new Error("Could not locate provided guess.");

    //get useful variables from current session
    const solutionWord = currentSession.solution;
    const gameFields = currentSession.fields;
    const guesses = currentSession.guesses + 1; //increment because you just guessed

    //get whether the guess is invalid or correct
    //note: autocomplete does NOT make invalid checks redundant if you're quick about it
    const guessInvalid = !WORDLE.guesses.includes(guess) && !WORDLE.extras.includes(guess);
    const guessCorrect = (guess == solutionWord);

    //check if the guess is invalid, and if it is invalid, that it's not also correct
    //(as stated above, seemingly invalid guesses can be correct with custom codes)
    if (guessInvalid && !guessCorrect) {
      await ctx.reply(`bruh "${guess}" is definitely not a word, try again`);
      return;
    }

    //get box colors for new guess and set them
    const letterColors = getLetterColors(solutionWord, guess);
    gameFields[guesses - 1] = {boxes: letterColors, word: guess.toUpperCase()};

    //get solution code for display
    const encryptedSolution = encryptWordCode(solutionWord);

    //create embed
    const wordleEmbed = createWordleEmbed(guesses, encryptedSolution, gameFields);

    //win/loss detection
    const userHasWon = letterColors.every(char => char === "🟩");
    const userHasLost = (!userHasWon && guesses == 6);

    if (userHasWon || userHasLost) { //MARK: game ended
      //remove empty fields
      const updatedGameFields: WordleGameFields = [];
      gameFields.forEach((row, i) => {
        if (!row.boxes.every(char => char === "🔲")) {
          updatedGameFields[i] = row;
        }
      });

      //add a button to copy game results
      const copyResultsButton = new ButtonBuilder()
        .setCustomId("wordle-copy-results")
        .setLabel("Copy Results")
        .setStyle(ButtonStyle.Success);
                    
      const wordleActionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(copyResultsButton);

      //reply to message
      const response = await ctx.reply({embeds: [wordleEmbed], components: [wordleActionRow]});
      if (userHasLost) {
        await response.reply({content: `bruh it was \`${solutionWord.toLowerCase()}\` how did you not get that`});
      }

      const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

      async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
        //create string of wordle results (looks weird but is fine in output)
        const resultsString = `\`\`\`\nBirdBox Wordle \nCode: ${encryptedSolution}\n${updatedGameFields.map(field => field.boxes.join("")).join("\n")}\n\`\`\``;

        //create embed for it
        const resultsEmbed = new EmbedBuilder()
          .setTitle("Results")
          .setDescription(`Copy in the top right corner! \n${resultsString}`);

        //send embed
        await i.reply({embeds: [resultsEmbed], flags: ["Ephemeral"]});
        await disableButton();
      }

      async function disableButton(): Promise<void> {
        //disable the button
        wordleActionRow.components[0].setDisabled(true);
        await response.edit({ components: [wordleActionRow] });
      }

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      buttonCollector.on("collect", async i => {await handleButtonInteraction(i);});
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      buttonCollector.on("end", async _ => {await disableButton();});

      //remove active session
      ctx.db.user.update(ctx.user.id, "activeWordle", undefined);
                    
      //update statistics, but only if there was no word code (to avoid cheating)
      if (!currentSession.usedCode) { //MARK: update statistics
        const userStats = ctx.db.user.fetchOr(ctx.user.id, "wordleStats", {
          guessStats: {
            "1": 0, "2": 0, "3": 0,
            "4": 0, "5": 0, "6": 0,
            "loss": 0
          },
          currentStreak: 0,
          bestStreak: 0
        }) as UserWordleStats;

        //change statistics based on game outcome
        if (userHasWon) {
          const guessNum = guesses.toString() as WordleGuessNum;
          userStats.guessStats[guessNum]++;
          userStats.currentStreak++;

          if (userStats.currentStreak > userStats.bestStreak) {
            userStats.bestStreak = userStats.currentStreak;
          }
        } else if (userHasLost) {
          userStats.guessStats.loss++;
          userStats.currentStreak = 0;
        }
                        
        //set new statistics
        ctx.db.user.update(ctx.user.id, "wordleStats", userStats);
      }

    } else { //MARK: game continuing

      //create button to see used letters thus far
      const usedLettersButton = new ButtonBuilder()
        .setCustomId("wordle-used-letters")
        .setLabel("See Used Letters")
        .setStyle(ButtonStyle.Secondary);
            
      const wordleActionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(usedLettersButton);
                    
      //send message
      const response = await ctx.reply({embeds: [wordleEmbed], components: [wordleActionRow]});

      const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

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
      buttonCollector.on("collect", async i => {await handleButtonInteraction(i);});
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      buttonCollector.on("end", async _ => {await disableButton();});

      //set new data
      ctx.db.user.update(ctx.user.id, "activeWordle", {
        solution: solutionWord, 
        guesses: guesses,
        fields: gameFields,
        usedCode: currentSession.usedCode
      });
    }
  },
});

export default WordleGuess;
