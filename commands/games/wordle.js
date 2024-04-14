const { randomMsg } = require("../../utils/scripts/util_scripts.js");
const { extras, guesses } = require("../../utils/json/wordle.json");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");

let wordleSessions = {};

module.exports = {
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
    async execute(interaction, {embedColors}) {
        switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
            case 'start': {
                const code = interaction.options?.getString('code')
                const guess = interaction.options?.getString('guess')?.toLowerCase()

                if (code?.length > 10) {
                    return interaction.reply({content: `what kinda code is that, use the code subcommand to get a valid one lol`, ephemeral: true})
                }

                if (guess && !guesses.includes(guess) && !extras.includes(guess)) {
                    return interaction.reply({content: `bruh ${guess} is definitely not a word, try again`, ephemeral: true})
                }

                const solutionWord = code ? decryptWordCode(code) : randomMsg('wordle')
                const encryptedSolution = encryptWordCode(solutionWord)

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
                    const keyboardString = handleUsedLettersDisplay(response, gameFields)
            
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
                    fields: gameFields
                }

                break;
            }
            case 'guess': {
                const currentSession = wordleSessions[interaction.member.id]

                if (!currentSession) {
                    return interaction.reply({content: `how bout you start a game before trying to guess lol`, ephemeral: true})
                }

                const guess = interaction.options?.getString('guess').toLowerCase()

                if (!guesses.includes(guess) && !extras.includes(guess)) {
                    return interaction.reply({content: `bruh ${guess} is definitely not a word, try again`, ephemeral: true})
                }

                const solutionWord = currentSession.solution
                const gameFields = currentSession.fields
                const numberOfGuesses = currentSession.guesses + 1

                const letterColors = getLetterColors(solutionWord, guess)

                gameFields[numberOfGuesses - 1] = {boxes: letterColors, word: guess.toUpperCase()};

                const encryptedSolution = encryptWordCode(solutionWord)

                const wordleEmbed = createWordleEmbed(embedColors, numberOfGuesses, encryptedSolution, gameFields)

                //win detection
                if (letterColors.every(char => char === "🟩")) { //win!
                    for (let i = 0; i < gameFields.length; i++) {
                        if (gameFields[i].boxes.every(char => char === "⬛")) {
                            gameFields[i] = undefined
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
                        const resultsString = `\`\`\`\nBirdBox Wordle \nID ${encryptedSolution}\n${gameFields.map(field => field?.boxes.join("")).join("\n")}\n\`\`\``

                        const resultsEmbed = new EmbedBuilder()
                            .setTitle("Copiable Results")
                            .setDescription(`Copy in the top right corner! \n${resultsString}`)

                        i.reply({embeds: [resultsEmbed], ephemeral: true})
                    })

                    buttonCollector.on('end', async () => {
                        //disable the button
                        wordleActionRow.components[0].setDisabled(true)
                        response.edit({ components: [wordleActionRow] })
                    })

                    wordleSessions[interaction.member.id] = undefined

                } else { //no win for you :(

                    const usedLettersButton = new ButtonBuilder()
                        .setCustomId("wordle-used-letters")
                        .setLabel("See Used Letters")
                        .setStyle(ButtonStyle.Secondary)
            
                    const wordleActionRow = new ActionRowBuilder()
                        .addComponents(usedLettersButton)
                    
                    const response = await interaction.reply({embeds: [wordleEmbed], components: [wordleActionRow]})

                    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                    buttonCollector.on('collect', async i => {
                        const keyboardString = handleUsedLettersDisplay(response, gameFields)
                
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
                        fields: gameFields
                    }
                }

                break;
            }
            case 'code': {

                break;
            }
        }
    }
}

const shuffledAlphabet = "rlzwvefuognicapqmytbjksxdh".split("")

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
    const hexCode = code.match(/(.{2})/g)

    let decryptedString = ""
    for (let letter of hexCode) {
        decryptedString += shuffledAlphabet[parseInt(letter, 16)]
    }

    return decryptedString
}

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

function handleUsedLettersDisplay(response, gameFields) {
    //proper spacing estimated by hand
    let keyboardTop = ""
    let keyboardMiddle = "     "
    let keyboardBottom = "                  "

    const keyboardTopEntries = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"]
    const keyboardMiddleEntries = ["A", "S", "D", "F", "G", "H", "J", "K", "L"]
    const keyboardBottomEntries = ["Z", "X", "C", "V", "B", "N", "M"]

    const letterStatus = new Map([
        ["Q", "🔲"],
        ["W", "🔲"],
        ["E", "🔲"],
        ["R", "🔲"],
        ["T", "🔲"],
        ["Y", "🔲"],
        ["U", "🔲"],
        ["I", "🔲"],
        ["O", "🔲"],
        ["P", "🔲"],
        ["A", "🔲"],
        ["S", "🔲"],
        ["D", "🔲"],
        ["F", "🔲"],
        ["G", "🔲"],
        ["H", "🔲"],
        ["J", "🔲"],
        ["K", "🔲"],
        ["L", "🔲"],
        ["Z", "🔲"],
        ["X", "🔲"],
        ["C", "🔲"],
        ["V", "🔲"],
        ["B", "🔲"],
        ["N", "🔲"],
        ["M", "🔲"]
    ])

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