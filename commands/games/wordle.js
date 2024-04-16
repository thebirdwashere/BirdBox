const { randomMsg } = require("../../utils/scripts/util_scripts.js");
const { extras, guesses } = require("../../utils/json/wordle.json");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");

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
        const focusedOption = interaction.options.getFocused(true)
        const guessedWord = focusedOption.value.toLowerCase()
        
        //have to access the solution in a different place based on subcommand
        const solutionWordIfGuess = wordleSessions?.[interaction.member.id]?.solution
        const solutionCodeIfStart = interaction?.options?._hoistedOptions?.filter(opt => opt?.name == 'code')?.[0]?.value //this is weird but it works
        const solutionWordIfStart = decryptWordCode(solutionCodeIfStart)
        
        const wordInvalid = !guesses.includes(guessedWord) && !extras.includes(guessedWord)
        const wordCorrect = (guessedWord == solutionWordIfGuess || guessedWord == solutionWordIfStart)

        let responseText
        if (guessedWord && wordInvalid && !wordCorrect) {
            responseText = `${guessedWord} is definitely not a word bruh, try something else`
        } else if (guessedWord) {
            responseText = guessedWord
        } else {
            responseText = `well hurry up and guess, i aint got all day`
        }

        await interaction.respond([{name: responseText, value: responseText}])

    },
    async execute(interaction, {embedColors, db}) {
        switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
            case 'start': { //MARK: start subcommand
                const code = interaction.options?.getString('code')
                const guess = interaction.options?.getString('guess')?.toLowerCase()

                if (code?.length > 10) {
                    return interaction.reply({content: `what kinda code is that, use the code subcommand to get a valid one lol`, ephemeral: true})
                }

                const solutionWord = code ? decryptWordCode(code) : randomMsg('wordle')
                const encryptedSolution = encryptWordCode(solutionWord)

                //note: autocomplete does NOT make this redundant if you're quick about it
                const guessInvalid = !guesses.includes(guess) && !extras.includes(guess)
                const guessCorrect = (guess == solutionWord)

                if (guess && guessInvalid && !guessCorrect) {
                    return interaction.reply({content: `bruh ${guess} is definitely not a word, try again`, ephemeral: true})
                }

                let numberOfGuesses = 0

                const gameFields = [
                    {boxes: ["⬛", "⬛", "⬛", "⬛", "⬛"], word: ""},
                    {boxes: ["⬛", "⬛", "⬛", "⬛", "⬛"], word: ""},
                    {boxes: ["⬛", "⬛", "⬛", "⬛", "⬛"], word: ""},
                    {boxes: ["⬛", "⬛", "⬛", "⬛", "⬛"], word: ""},
                    {boxes: ["⬛", "⬛", "⬛", "⬛", "⬛"], word: ""},
                    {boxes: ["⬛", "⬛", "⬛", "⬛", "⬛"], word: ""}
                ]

                if (guess) {
                    gameFields[0] = {boxes: getLetterColors(solutionWord, guess), word: guess.toUpperCase()};
                    numberOfGuesses++;
                }

                const wordleEmbed = createWordleEmbed(embedColors, numberOfGuesses, encryptedSolution, gameFields)

                const usedLettersButton = new ButtonBuilder()
                    .setCustomId("wordle-used-letters")
                    .setLabel("See Used Letters")
                    .setStyle(ButtonStyle.Secondary)
        
                const wordleActionRow = new ActionRowBuilder()
                    .addComponents(usedLettersButton)
                
                const response = await interaction.reply({embeds: [wordleEmbed], components: [wordleActionRow]})

                const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                buttonCollector.on('collect', async i => {
                    const keyboardString = handleUsedLettersDisplay(gameFields)
            
                    i.reply({content: keyboardString, ephemeral: true})
                })
            
                buttonCollector.on('end', async () => {
                    //disable the button
                    wordleActionRow.components[0].setDisabled(true)
                    response.edit({ components: [wordleActionRow] })
                })

                wordleSessions[interaction.member.id] = {
                    solution: solutionWord, 
                    guesses: numberOfGuesses,
                    fields: gameFields,
                    usedCode: !!code //this is somehow the recommended way to convert to a bool
                }

                break;
            }
            case 'guess': {//MARK: guess subcommand
                const currentSession = wordleSessions[interaction.member.id]

                if (!currentSession) {
                    return interaction.reply({content: `how bout you start a game before trying to guess lol`, ephemeral: true})
                }

                const guess = interaction.options?.getString('guess').toLowerCase()

                const solutionWord = currentSession.solution
                const gameFields = currentSession.fields
                const numberOfGuesses = currentSession.guesses + 1

                //note: autocomplete does NOT make this redundant if you're quick about it
                const guessInvalid = !guesses.includes(guess) && !extras.includes(guess)
                const guessCorrect = (guess == solutionWord)

                if (guessInvalid && !guessCorrect) {
                    return interaction.reply({content: `bruh ${guess} is definitely not a word, try again`, ephemeral: true})
                }

                const letterColors = getLetterColors(solutionWord, guess)

                gameFields[numberOfGuesses - 1] = {boxes: letterColors, word: guess.toUpperCase()};

                const encryptedSolution = encryptWordCode(solutionWord)

                const wordleEmbed = createWordleEmbed(embedColors, numberOfGuesses, encryptedSolution, gameFields)

                //win/loss detection
                const userHasWon = letterColors.every(char => char === "🟩")
                const userHasLost = numberOfGuesses == 6

                if (userHasWon || userHasLost) { //MARK: game ended
                    let updatedGameFields = []
                    for (let i = 0; i < gameFields.length; i++) {
                        if (!gameFields[i].boxes.every(char => char === "⬛")) {
                            updatedGameFields[i] = gameFields[i]
                        }
                    }

                    const copyResultsButton = new ButtonBuilder()
                        .setCustomId("wordle-copy-results")
                        .setLabel("Copy Results")
                        .setStyle(ButtonStyle.Success)
                    
                    const wordleActionRow = new ActionRowBuilder()
                        .addComponents(copyResultsButton)

                    const response = await interaction.reply({embeds: [wordleEmbed], components: [wordleActionRow]})

                    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                    buttonCollector.on('collect', async i => {
                        const resultsString = `\`\`\`\nBirdBox Wordle \nID ${encryptedSolution}\n${updatedGameFields.map(field => field?.boxes.join("")).join("\n")}\n\`\`\``

                        const resultsEmbed = new EmbedBuilder()
                            .setTitle("Results")
                            .setDescription(`Copy in the top right corner! \n${resultsString}`)

                        i.reply({embeds: [resultsEmbed], ephemeral: true})
                    })

                    buttonCollector.on('end', async () => {
                        //disable the button
                        wordleActionRow.components[0].setDisabled(true)
                        response.edit({ components: [wordleActionRow] })
                    })

                    wordleSessions[interaction.member.id] = undefined
                    
                    //updating statistics now, but only if there was no word code (to avoid cheating)
                    if (!currentSession.usedCode) {
                        let userStats = await db.get(`wordle_stats.random_6letter.${interaction.member.id}`);

                        if (!userStats) userStats = {
                            guess_stats: {
                                "1": 0, "2": 0, "3": 0,
                                "4": 0, "5": 0, "6": 0,
                                "loss": 0
                            },
                            current_streak: 0,
                            best_streak: 0
                        };

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
    
                        await db.set(`wordle_stats.random_6letter.${interaction.member.id}`, userStats);
                    }

                } else { //MARK: game continuing

                    const usedLettersButton = new ButtonBuilder()
                        .setCustomId("wordle-used-letters")
                        .setLabel("See Used Letters")
                        .setStyle(ButtonStyle.Secondary)
            
                    const wordleActionRow = new ActionRowBuilder()
                        .addComponents(usedLettersButton)
                    
                    const response = await interaction.reply({embeds: [wordleEmbed], components: [wordleActionRow]})

                    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                    buttonCollector.on('collect', async i => {
                        const keyboardString = handleUsedLettersDisplay(gameFields)
                
                        i.reply({content: keyboardString, ephemeral: true})
                    })
                
                    buttonCollector.on('end', async () => {
                        //disable the button
                        wordleActionRow.components[0].setDisabled(true)
                        response.edit({ components: [wordleActionRow] })
                    })

                    wordleSessions[interaction.member.id] = {
                        solution: solutionWord, 
                        guesses: numberOfGuesses,
                        fields: gameFields,
                        usedCode: currentSession.usedCode
                    }
                }

                break;
            }
            case 'code': { //MARK: code subcommand
                    const word = interaction.options?.getString('word')

                    if (word.length != 5) return await interaction.reply({content: `bruh we need a 5 letter word for wordle`, ephemeral: true})

                    const encryptedCode = encryptWordCode(word.toLowerCase())

                    const responseText = `The Wordle code for ${word} is \`${encryptedCode}\`. \nUse \`/wordle code\` to play your custom game!`
                    await interaction.reply({content: responseText, ephemeral: true})
                break;
            }
        }
    }
}

const shuffledAlphabet = "rlzwvefuognicapqmytbjksxdh".split("")

//MARK: code encryption functions
function encryptWordCode(word) {
    const splitWord = word.split("")

    let hexWord = ""
    for (let letter of splitWord) {
        const letterCode = shuffledAlphabet.indexOf(letter)
        const encryptedLetter = letterCode.toString(16)
        const paddedEncryptedLetter = ("0" + encryptedLetter).slice(-2)
        hexWord += paddedEncryptedLetter
    }

    return hexWord
}

function decryptWordCode(code) {
    if (!code) return;

    const hexCode = code.match(/(.{2})/g)

    let decryptedString = ""
    for (let letter of hexCode) {
        decryptedString += shuffledAlphabet[parseInt(letter, 16)]
    }

    return decryptedString
}

//MARK: gameplay functions
function getLetterColors(solutionWord, guessedWord) {
    //behavior sourced from https://www.reddit.com/r/wordle/comments/ry49ne/illustration_of_what_happens_when_your_guess_has/
    //more or less modified the source code from https://github.com/Hugo0/wordle/blob/main/webapp/static/game.js

    let colorsArray = ["⬛", "⬛", "⬛", "⬛", "⬛"];
    let numberOfEachLetter = {};

    for (let letter of solutionWord) {
        numberOfEachLetter[letter] = numberOfEachLetter[letter] ? numberOfEachLetter[letter] += 1 : 1;
    }

    //color greens
    for (let i = 0; i < solutionWord.length; i++) {
        if (solutionWord[i] == guessedWord[i]) {
            colorsArray[i] = "🟩";

            numberOfEachLetter[guessedWord[i]] -= 1;
        }
    }

    //color yellows
    for (let i = 0; i < solutionWord.length; i++) {
        if (numberOfEachLetter[guessedWord[i]] && colorsArray[i] == "⬛") {
            colorsArray[i] = "🟨";

            numberOfEachLetter[guessedWord[i]] -= 1;
        }
    }

    return colorsArray;
}

function createWordleEmbed(embedColors, numberOfGuesses, encryptedSolution, gameFields) {

    const wordleEmbed = new EmbedBuilder()
    .setTitle(`Wordle Game`)
    .setColor(embedColors.blue)
    .setFooter({text: `Guess ${numberOfGuesses}/6 ● ${encryptedSolution}`})

    let boxString = ""
    for (let row of gameFields) {
        boxString += `${row.boxes.join("")} ${row.word}\n`
    }

    wordleEmbed.setDescription(boxString)

    return wordleEmbed
}

function handleUsedLettersDisplay(gameFields) {
    //proper spacing estimated by hand
    let keyboardTop = ""
    let keyboardMiddle = "     "
    let keyboardBottom = "                    "

    const keyboardTopEntries = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"]
    const keyboardMiddleEntries = ["A", "S", "D", "F", "G", "H", "J", "K", "L"]
    const keyboardBottomEntries = ["Z", "X", "C", "V", "B", "N", "M"]

    const keyboardLetters = keyboardTopEntries.concat(keyboardMiddleEntries, keyboardBottomEntries)

    let keyboardMapArray = []
    for (let letter of keyboardLetters) {
        //format:
        //[
        //  ["LETTER", "EMOJI"]
        //]
        keyboardMapArray.push([letter, "🔲"])
    }

    const letterStatus = new Map(keyboardMapArray)

    for (const field of gameFields) {
        for (let num = 0; num < 5; num++) {
            const letter = field.word[num]?.toUpperCase()
            const newBox = field.boxes[num]
            const currentBox = letterStatus.get(letter)

            if (letter && currentBox != "🟩") {
                letterStatus.set(letter, newBox)
            }
        }
    }

    for (const [key, val] of letterStatus.entries()) {
        if (keyboardTopEntries.includes(key)) {
            keyboardTop += `${val}${key} `
        } else if (keyboardMiddleEntries.includes(key)) {
            keyboardMiddle += `${val}${key} `
        } else if (keyboardBottomEntries.includes(key)) {
            keyboardBottom += `${val}${key} `
        }
    }

    const keyboardString = `${keyboardTop}\n${keyboardMiddle}\n${keyboardBottom}`

    return keyboardString
}