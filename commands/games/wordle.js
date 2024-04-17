const { randomMsg } = require("../../utils/scripts/util_scripts.js");
const { extras, guesses } = require("../../utils/json/wordle.json");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");

//variable used for storing active wordle games
let wordleSessions = {};

module.exports = { //MARK: command data
    data: new SlashCommandBuilder()
		.setName('wordle')
		.setDescription('Play the iconic daily game anytime on BirdBox!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new Wordle game.')
                .addStringOption(option =>
                    option
                        .setName('code')
                        .setDescription('Use a code from a friend to start the game with a specific word.')
                )
                .addStringOption(option =>
                    option
                        .setName('guess')
                        .setDescription('Make your first guess without wasting time running two commands.')
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName('solutions')
                        .setDescription('Allow for every valid guess to be a possible answer, rather than just the curated list of solutions.')
                        .addChoices(
                            { name: `curated`, value: "wordle" },
                            { name: `all`, value: "wordle all" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('guess')
                .setDescription('Make a guess on an active Wordle game.')
                .addStringOption(option =>
                    option
                        .setName('guess')
                        .setDescription('The word you want to guess.')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View high scores across all BirdBox users.')
                .addStringOption(option =>
                    option
                        .setName('statistic')
                        .setDescription('Change what statistic you want to view.')
                        .setRequired(true)
                        .addChoices(
                            { name: `average guesses`, value: "average guesses" },
                            { name: `win percentage`, value: "win percentage" },
                            { name: `best streak`, value: "best streak" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('code')
                .setDescription('Get the code for a word to share it with others.')
                .addStringOption(option =>
                    option
                        .setName('word')
                        .setDescription('The word you want to encrypt.')
                        .setRequired(true)
                )
        ),
    async autocomplete(interaction) { //MARK: autocomplete
        const focusedOption = interaction.options.getFocused(true);
        const guessedWord = focusedOption.value.toLowerCase();
        
        //have to access the solution in a different place based on subcommand
        const solutionWordIfGuess = wordleSessions?.[interaction.member.id]?.solution;
        const solutionCodeIfStart = interaction?.options?._hoistedOptions?.filter(opt => opt?.name == 'code')?.[0]?.value; //this is weird but it works
        const solutionWordIfStart = decryptWordCode(solutionCodeIfStart);
        
        //get whether the word is invalid and whether the word is the solution
        //(the solution may sometimes be invalid with custom codes)
        const wordInvalid = !guesses.includes(guessedWord) && !extras.includes(guessedWord);
        const wordCorrect = (guessedWord == solutionWordIfGuess || guessedWord == solutionWordIfStart);

        //get response text based on above variables
        let responseText;
        if (guessedWord && wordInvalid && !wordCorrect) {
            responseText = `${guessedWord} is definitely not a word bruh, try something else`;
        } else if (guessedWord) {
            //autocomplete... autocompletes, so if the word is usable autocomplete to the word lol
            responseText = guessedWord;
        } else {
            responseText = `well hurry up and guess, i aint got all day`; //because we do need some text there
        }

        //send autocomplete
        await interaction.respond([{name: responseText, value: responseText}]);

    },
    async execute(interaction, {embedColors, client, db}) {
        switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
            case 'start': { //MARK: start subcommand
                const code = interaction.options?.getString('code');
                const guess = interaction.options?.getString('guess')?.toLowerCase();
                const moreSolutions = interaction.options?.getString('solutions') ?? 'wordle';

                //do some checking that the code is valid
                const codeRegex = /^[0-9A-F]{10}$/i;
                if (code && !codeRegex.test(code)) {
                    return interaction.reply({content: `what kinda code is that, use the code subcommand to get a valid one lol`, ephemeral: true});
                }

                //get the solution and its code form
                const solutionWord = code ? decryptWordCode(code) : randomMsg(moreSolutions);
                const encryptedSolution = encryptWordCode(solutionWord);

                //get whether the guess is invalid or correct
                //note: autocomplete does NOT make invalid checks redundant if you're quick about it
                const guessInvalid = !guesses.includes(guess) && !extras.includes(guess);
                const guessCorrect = (guess == solutionWord);

                //check if the guess is invalid, and if it is invalid, that it's not also correct
                //(as stated above, seemingly invalid guesses can be correct with custom codes)
                if (guess && guessInvalid && !guessCorrect) {
                    return interaction.reply({content: `bruh "${guess}" is definitely not a word, try again`, ephemeral: true});
                }

                //initalize the number of guesses thus far
                let numberOfGuesses = 0;

                //create the wordle box data
                const emptyBoxRow = ["🔲", "🔲", "🔲", "🔲", "🔲"];
                const gameFields = [
                    {boxes: emptyBoxRow, word: ""},
                    {boxes: emptyBoxRow, word: ""},
                    {boxes: emptyBoxRow, word: ""},
                    {boxes: emptyBoxRow, word: ""},
                    {boxes: emptyBoxRow, word: ""},
                    {boxes: emptyBoxRow, word: ""}
                ]

                
                if (guess) { //get the guess results and increment guess count
                    gameFields[0] = {boxes: getLetterColors(solutionWord, guess), word: guess.toUpperCase()};
                    numberOfGuesses++;
                }

                //create embed
                const wordleEmbed = createWordleEmbed(embedColors, numberOfGuesses, encryptedSolution, gameFields);

                //create button to see used letters thus far
                const usedLettersButton = new ButtonBuilder()
                    .setCustomId("wordle-used-letters")
                    .setLabel("See Used Letters")
                    .setStyle(ButtonStyle.Secondary);
        
                const wordleActionRow = new ActionRowBuilder()
                    .addComponents(usedLettersButton);
                
                //send message
                const response = await interaction.reply({embeds: [wordleEmbed], components: [wordleActionRow]});

                const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

                buttonCollector.on('collect', async i => {
                    //get used letters and display it
                    const keyboardString = handleUsedLettersDisplay(gameFields);
            
                    await i.reply({content: keyboardString, ephemeral: true});
                })
            
                buttonCollector.on('end', async () => {
                    //disable the button
                    wordleActionRow.components[0].setDisabled(true);
                    await response.edit({ components: [wordleActionRow] });
                })

                //set wordle data in the variable
                wordleSessions[interaction.member.id] = {
                    solution: solutionWord, 
                    guesses: numberOfGuesses,
                    fields: gameFields,
                    usedCode: !!code //this is somehow the recommended way to convert to a bool lol
                };

                break;
            }
            case 'guess': {//MARK: guess subcommand
                const currentSession = wordleSessions[interaction.member.id];

                if (!currentSession) {
                    return interaction.reply({content: `how bout you start a game before trying to guess lol`, ephemeral: true});
                }
                
                //get guess and set to lower case
                const guess = interaction.options?.getString('guess').toLowerCase();

                //get useful variables from current session
                const solutionWord = currentSession.solution;
                const gameFields = currentSession.fields;
                const numberOfGuesses = currentSession.guesses + 1; //increment because you just guessed

                //get whether the guess is invalid or correct
                //note: autocomplete does NOT make invalid checks redundant if you're quick about it
                const guessInvalid = !guesses.includes(guess) && !extras.includes(guess);
                const guessCorrect = (guess == solutionWord);

                //check if the guess is invalid, and if it is invalid, that it's not also correct
                //(as stated above, seemingly invalid guesses can be correct with custom codes)
                if (guessInvalid && !guessCorrect) {
                    return interaction.reply({content: `bruh ${guess} is definitely not a word, try again`, ephemeral: true});
                }

                //get box colors for new guess and set them
                const letterColors = getLetterColors(solutionWord, guess);
                gameFields[numberOfGuesses - 1] = {boxes: letterColors, word: guess.toUpperCase()};

                //get solution code for display
                const encryptedSolution = encryptWordCode(solutionWord);

                //create embed
                const wordleEmbed = createWordleEmbed(embedColors, numberOfGuesses, encryptedSolution, gameFields);

                //win/loss detection
                const userHasWon = letterColors.every(char => char === "🟩");
                const userHasLost = (numberOfGuesses == 6);

                if (userHasWon || userHasLost) { //MARK: game ended
                    //remove empty fields
                    let updatedGameFields = [];
                    for (let i = 0; i < gameFields.length; i++) {
                        if (!gameFields[i].boxes.every(char => char === "🔲")) {
                            updatedGameFields[i] = gameFields[i];
                        }
                    }

                    //add a button to copy game results
                    const copyResultsButton = new ButtonBuilder()
                        .setCustomId("wordle-copy-results")
                        .setLabel("Copy Results")
                        .setStyle(ButtonStyle.Success);
                    
                    const wordleActionRow = new ActionRowBuilder()
                        .addComponents(copyResultsButton);

                    //reply to message
                    const response = await interaction.reply({embeds: [wordleEmbed], components: [wordleActionRow]});

                    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

                    buttonCollector.on('collect', async i => {
                        //create string of wordle results (looks weird but is fine in output)
                        const resultsString = `\`\`\`\nBirdBox Wordle \nCode: ${encryptedSolution}\n${updatedGameFields.map(field => field?.boxes.join("")).join("\n")}\n\`\`\``;

                        //create embed for it
                        const resultsEmbed = new EmbedBuilder()
                            .setTitle("Results")
                            .setDescription(`Copy in the top right corner! \n${resultsString}`);

                        //send embed
                        await i.reply({embeds: [resultsEmbed], ephemeral: true});
                    })

                    buttonCollector.on('end', async () => {
                        //disable the button
                        wordleActionRow.components[0].setDisabled(true);
                        await response.edit({ components: [wordleActionRow] });
                    })

                    //remove active session
                    wordleSessions[interaction.member.id] = undefined;
                    
                    //update statistics, but only if there was no word code (to avoid cheating)
                    if (!currentSession.usedCode) { //MARK: update statistics
                        let userStats = await db.get(`wordle_stats.random_6letter.${interaction.member.id}`);

                        //default stats layout
                        if (!userStats) userStats = {
                            guess_stats: {
                                "1": 0, "2": 0, "3": 0,
                                "4": 0, "5": 0, "6": 0,
                                "loss": 0
                            },
                            current_streak: 0,
                            best_streak: 0
                        }

                        //change statistics based on game outcome
                        if (userHasWon) {
                            userStats.guess_stats[numberOfGuesses]++;
                            userStats.current_streak++;

                            if (userStats.current_streak > userStats.best_streak) {
                                userStats.best_streak = userStats.current_streak;
                            }
                        } else if (userHasLost) {
                            userStats.guess_stats["loss"]++;
                            userStats.current_streak = 0;
                        }
                        
                        //set new statistics
                        await db.set(`wordle_stats.random_6letter.${interaction.member.id}`, userStats);
                    }

                } else { //MARK: game continuing

                    //create button to see used letters thus far
                    const usedLettersButton = new ButtonBuilder()
                        .setCustomId("wordle-used-letters")
                        .setLabel("See Used Letters")
                        .setStyle(ButtonStyle.Secondary);
            
                    const wordleActionRow = new ActionRowBuilder()
                        .addComponents(usedLettersButton);
                    
                    //send message
                    const response = await interaction.reply({embeds: [wordleEmbed], components: [wordleActionRow]});

                    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                    buttonCollector.on('collect', async i => {
                        //get used letters and display it
                        const keyboardString = handleUsedLettersDisplay(gameFields);
                
                        i.reply({content: keyboardString, ephemeral: true});
                    })
                
                    buttonCollector.on('end', async () => {
                        //disable the button
                        wordleActionRow.components[0].setDisabled(true);
                        response.edit({ components: [wordleActionRow] });
                    })

                    //set new data in session
                    wordleSessions[interaction.member.id] = {
                        solution: solutionWord, 
                        guesses: numberOfGuesses,
                        fields: gameFields,
                        usedCode: currentSession.usedCode
                    }
                }

                break;
            }
            case 'leaderboard': { //MARK: leaderboard subcommand
                const statisticChoice = interaction.options?.getString('statistic');

                //create embed with default data used across all leaderboards
                const leaderboardEmbed = new EmbedBuilder()
                .setColor(embedColors.purple)
                .setFooter({ text: "look at all these amateurs"});

                //get game statistics
                const gameStats = await db.get(`wordle_stats.random_6letter`);

                if (!gameStats) {
                    leaderboardEmbed
                        .setTitle("Wordle Game")
                        .setDescription("huh, looks like there's nothing here");
                    
                    return await interaction.reply({ embeds: [leaderboardEmbed] });
                }

                //statistic display functions (decided not to use a switch for no particular reason)
                const statisticDisplays = {
                    'average guesses': async () => { //MARK: average guesses statistic
                        leaderboardEmbed.setTitle("Wordle Game - Average Guesses per Game");
                        
                        //array will be compressed into text later on
                        let averageLeaderboardArray = [];
                        let averageLeaderboardText = "";
                        
                        //for every user in the game stats
                        for (const userId of Object.keys(gameStats)) {
                            //get username for display
                            const userInfo = await client.users.fetch(userId);
                            const userName = userInfo.username;
                            gameStats[userId].name = userName;

                            //get number of played games for average calculation
                            const guessStats = gameStats[userId].guess_stats;
                            const numberOfGames = guessStats[1] + guessStats[2] + guessStats[3] + guessStats[4] + guessStats[5] + guessStats[6];

                            //get number of guesses made across all games for average calculation
                            let numberOfGuesses = 0;
                            for (const [key, val] of Object.entries(guessStats)) {

                                if (key != "loss") {
                                    //multiply the number of instances where it took x many guesses
                                    //by x to get the number of guesses, then add it to running total
                                    numberOfGuesses += (val * key);
                                }
                            }

                            //calculate average and set
                            const averageGuessesPerGame = (numberOfGuesses / numberOfGames).toFixed(2);
                            gameStats[userId].avg = averageGuessesPerGame;

                            averageLeaderboardArray.push(gameStats[userId]);
                        }
        
                        //sort by lowest average (kinda confusing)
                        averageLeaderboardArray.sort((a, b) => {
                            if (a.avg < b.avg) return -1;
                            else if (a.avg > a.avg) return 1;
                            else return 0;
                        });
                        
                        //create text based on array data
                        for (user of averageLeaderboardArray) {
                            averageLeaderboardText += `${user.name}: **${user.avg} guesses**\n`;
                        }
        
                        leaderboardEmbed.setDescription(averageLeaderboardText);
                    },
                    'win percentage': async () => { //MARK: win percentage statistic
                        leaderboardEmbed.setTitle("Wordle Game - Highest Win Percentage");
                        
                        //array will be compressed into text later on
                        let percentLeaderboardArray = [];
                        let percentLeaderboardText = "";

                        for (const userId of Object.keys(gameStats)) {
                            //get username for display
                            const userInfo = await client.users.fetch(userId);
                            const userName = userInfo.username;
                            gameStats[userId].name = userName;

                            //calculate win percentage from won games / total games and display as percentage
                            const guessStats = gameStats[userId].guess_stats;
                            const numberOfWonGames = guessStats[1] + guessStats[2] + guessStats[3] + guessStats[4] + guessStats[5] + guessStats[6];
                            const numberOfGames = numberOfWonGames + guessStats["loss"];
                            const winPercentage = Number(numberOfWonGames / numberOfGames).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2});
                            
                            //set win percentage
                            gameStats[userId].win_percent = winPercentage;
                            percentLeaderboardArray.push(gameStats[userId]);
                        }

                        //sort by most points (kinda confusing)
                        percentLeaderboardArray.sort((a, b) => {
                            if (a.win_percent < b.win_percent) return -1;
                            else if (a.win_percent > a.win_percent) return 1;
                            else return 0;
                        });

                        //create text based on array data
                        for (user of percentLeaderboardArray) {
                            percentLeaderboardText += `${user.name}: **${user.win_percent} of games**\n`;
                        }

                        leaderboardEmbed.setDescription(percentLeaderboardText);
                    },
                    'best streak': async () => { //MARK: best streak statistic
                        leaderboardEmbed.setTitle("Wordle Game - Longest Win Streak");
      
                        //array will be compressed into text later on
                        let streakLeaderboardArray = [];
                        let streakLeaderboardText = "";

                        for (const userId of Object.keys(gameStats)) {
                            //get username for display
                            const userInfo = await client.users.fetch(userId);
                            const userName = userInfo.username;
                            gameStats[userId].name = userName;

                            //no further calculation here; best streak is handled on win/loss
                            streakLeaderboardArray.push(gameStats[userId]);
                        }

                        //sort by most points (kinda confusing)
                        streakLeaderboardArray.sort((a, b) => {
                            if (a.best_streak > b.best_streak) return -1;
                            else if (a.best_streak < a.best_streak) return 1;
                            else return 0;
                        });

                        //create text
                        for (user of streakLeaderboardArray) {
                            if (user.best_streak == 1) { //for game/games pluralization
                                streakLeaderboardText += `${user.name}: **${user.best_streak} game**\n`;
                            } else {
                                streakLeaderboardText += `${user.name}: **${user.best_streak} games**\n`;
                            }
                        }

                        leaderboardEmbed.setDescription(streakLeaderboardText);
                    }
                }

                //MARK: handling statistic selector
                await statisticDisplays[statisticChoice]();

                //create statistics selector of all stats
                const statSelector = new StringSelectMenuBuilder()
                    .setCustomId('statSelector')
                    .setPlaceholder('Select statistic...')
                    .addOptions([
                        new StringSelectMenuOptionBuilder()
                            .setLabel("points")
                            .setValue("points"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("win percentage")
                            .setValue("win percentage"),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("best streak")
                            .setValue("best streak")
                    ]);

                const selectorRow = new ActionRowBuilder()
                    .addComponents(statSelector);
                
                //send message
                const response = await interaction.reply({ embeds: [leaderboardEmbed], components: [selectorRow] });

                const menuCollector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });
                
                menuCollector.on('collect', async i => {
                    //get new statistic and data
                    const newStatisticChoice = i.values[0];
                    await statisticDisplays[newStatisticChoice]();

                    //edit leaderboard
                    await response.edit({ embeds: [leaderboardEmbed] });
                    await i.deferUpdate();
                })

                menuCollector.on('end', async () => {
                    //disable the selector
                    selectorRow.components[0].setDisabled(true);
                    response.edit({ components: [selectorRow] });
                })

                break;
            }
            case 'code': { //MARK: code subcommand
                const word = interaction.options?.getString('word');

                //any 5 letter string works, even ones not in the json
                if (word.length != 5) return await interaction.reply({content: `bruh we need a 5 letter word for wordle`, ephemeral: true});

                //get the word code (duh)
                const encryptedCode = encryptWordCode(word.toLowerCase());

                //tell em what the code is
                const responseText = `The Wordle code for ${word} is \`${encryptedCode}\`. \nUse \`/wordle code\` to play your custom game!`;
                await interaction.reply({content: responseText, ephemeral: true});

                break;
            }
        }
    }
}

//for code encryption and decryption (shuffled for the tiniest bit of protection)
const shuffledAlphabet = "rlzwvefuognicapqmytbjksxdh".split("");

//MARK: code encryption functions
function encryptWordCode(word) {
    //get each letter of the word
    const splitWord = word.split("");

    let hexWord = "";
    for (let letter of splitWord) {
        //get letter's position 
        const letterCode = shuffledAlphabet.indexOf(letter);

        //convert letter's position to base 16 (hexadecimal)
        const encryptedLetter = letterCode.toString(16);

        //if the hex representation only needs one char, add a 0 before it
        const paddedEncryptedLetter = ("0" + encryptedLetter).slice(-2);

        hexWord += paddedEncryptedLetter;
    }

    return hexWord;
}

function decryptWordCode(code) {
    if (!code) return;

    //simple regex to get an array of every 2 characters
    const hexCode = code.match(/(.{2})/g);

    let decryptedString = "";
    for (let number of hexCode) {
        //parse the number as its hexadecimal representation
        const numberInDec = parseInt(number, 16);

        //add the matching letter from the shuffled alphabet
        decryptedString += shuffledAlphabet[numberInDec];
    }

    return decryptedString;
}

//MARK: get letter colors
function getLetterColors(solutionWord, guessedWord) {
    //behavior sourced from https://www.reddit.com/r/wordle/comments/ry49ne/illustration_of_what_happens_when_your_guess_has/
    //more or less modified the source code from https://github.com/Hugo0/wordle/blob/main/webapp/static/game.js

    //create blank row
    let colorsArray = ["⬛", "⬛", "⬛", "⬛", "⬛"];

    //get the amount of each letter
    let numberOfEachLetter = {};
    for (let letter of solutionWord) {
        //ternary; basically this declares to 1 if not there or adds 1 if it is
        numberOfEachLetter[letter] = numberOfEachLetter[letter] ? numberOfEachLetter[letter] += 1 : 1;
    }

    //color greens
    for (let i = 0; i < solutionWord.length; i++) {
        if (solutionWord[i] == guessedWord[i]) {
            colorsArray[i] = "🟩";

            //get rid of letter so it doesn't get matched by doubles
            numberOfEachLetter[guessedWord[i]] -= 1;
        }
    }

    //color yellows
    for (let i = 0; i < solutionWord.length; i++) {
        if (numberOfEachLetter[guessedWord[i]] && colorsArray[i] == "⬛" /*don't match greens*/) { 
            colorsArray[i] = "🟨";
            
            //get rid of letter so it doesn't get matched by doubles
            numberOfEachLetter[guessedWord[i]] -= 1;
        }
    }

    return colorsArray;
}

//MARK: create wordle embed
function createWordleEmbed(embedColors, numberOfGuesses, encryptedSolution, gameFields) {

    //get embed
    const wordleEmbed = new EmbedBuilder()
    .setTitle(`Wordle Game`)
    .setColor(embedColors.blue)
    .setFooter({text: `Guess ${numberOfGuesses}/6 ● ${encryptedSolution}`});

    //set each row of boxes
    let boxString = "";
    for (let row of gameFields) {
        boxString += `${row.boxes.join("")} ${row.word}\n`;
    }

    wordleEmbed.setDescription(boxString);

    return wordleEmbed;
}

//MARK: used letters display
function handleUsedLettersDisplay(gameFields) {
    //inital spacing spacing; estimated by hand but looks fine
    let keyboardTop = "";
    let keyboardMiddle = "     ";
    let keyboardBottom = "                    ";

    //each row of the keyboard and top row
    const keyboardTopEntries = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
    const keyboardMiddleEntries = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
    const keyboardBottomEntries = ["Z", "X", "C", "V", "B", "N", "M"];
    const keyboardLetters = keyboardTopEntries.concat(keyboardMiddleEntries, keyboardBottomEntries);

    let keyboardMapArray = [];
    for (let letter of keyboardLetters) {
        //format:
        //[
        //  ["LETTER", "EMOJI"]
        //]
        keyboardMapArray.push([letter, "🔲"]);
    }

    //create a map (ooh fancy)
    //a map appears to just be an object that remembers order and can be iterated over
    const letterStatus = new Map(keyboardMapArray);

    for (const field of gameFields) {
        for (let num = 0; num < 5; num++) {
            //get each letter in each field and its corresponding box
            const letter = field.word[num]?.toUpperCase();
            const newBox = field.boxes[num];

            //get what the box currently is in the map
            const currentBox = letterStatus.get(letter);

            //if the current box is not green, it's fine to overwrite
            //imagine if we overwrote greens for yellows lol
            if (letter && currentBox != "🟩") {
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