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

                if (!guesses.includes(guess) && !extras.includes(guess)) {
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
                
                const response = await interaction.reply({embeds: [wordleEmbed]})

                wordleSessions[interaction.member.id] = {
                    channel: interaction.channel.id, 
                    message: response.id, 
                    solution: solutionWord, 
                    guesses: numberOfGuesses,
                    fields: gameFields
                }

                break;
            }
            case 'guess': {
                const currentSession = wordleSessions[interaction.member.id]

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

                    const resultsString = `\`\`\`\nBirdBox Wordle \n${encryptedSolution}\n${gameFields.map(field => field?.boxes.join("")).join("\n")}\n\`\`\``

                    const resultsEmbed = new EmbedBuilder()
                        .setTitle("Copiable Results")
                        .setDescription(resultsString)

                    await interaction.reply({embeds: [wordleEmbed, resultsEmbed]})

                } else { //no win for you :(
                    

                    const response = await interaction.reply({embeds: [wordleEmbed]})
    
                    wordleSessions[interaction.member.id] = {
                        channel: interaction.channel.id, 
                        message: response.id, 
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