const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { rps } = require("../../utils/json/responses.json");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('rps')
		.setDescription('Play Rock, Paper, Scissors with the bot. Simple and pure fun.')
        .addStringOption(option =>
			option
				.setName('move')
				.setDescription('Your move to play.')
                .setMaxLength(1024)
				.setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {

        const choices = [].concat(rps.map(item => item.names[0]));

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.charAt(0).toLowerCase() + focusedOption.value.slice(1)
        let filtered = choices.filter(choice => choice.startsWith(value));
        filtered = filtered.map(choice => ({ name: choice, value: choice }));
        filtered = filtered.slice(0, 25);

        await interaction.respond(filtered);

    },
    async execute(interaction, { embedColors }) {

        const validMoves = ([].concat(...rps.map(item => item.names)));
        const moveNames = [].concat(rps.map(item => item.names[0]));
        const emojis = rps.map(item => item.emoji);

        let playerMove = interaction.options.getString('move');
        let computerMove = moveNames[Math.floor(Math.random() * moveNames.length)];
        let result, footer, color;

        if(!validMoves.includes(playerMove)) return interaction.reply({ content: 'bruh it\'s literally the title of the game, you gotta use "rock", "paper", or "scissors".', ephemeral: true });

        const abbvMoves = Object.fromEntries([].concat(rps.map(item => item.names[1])).map((key, index) => [key, [].concat(rps.map(item => item.names[0]))[index]]));
        if(abbvMoves[playerMove]) playerMove = abbvMoves[playerMove];

        let playerMoveNum = moveNames.indexOf(playerMove);
        let computerMoveNum = moveNames.indexOf(computerMove);

        if (playerMoveNum === computerMoveNum) {result = 'You Tied!'; footer = 'kinda mid game ngl'; color = embedColors.yellow;}
		else if (((playerMoveNum - computerMoveNum) + 3) % 3 === 1) {result = 'You Won!'; footer = 'decent job chump'; color = embedColors.green;}
		else {result = 'You Lost!'; footer = 'massive L';  color = embedColors.red;}

        const rpsEmbed = new EmbedBuilder()
            .setTitle(result)
            .setColor(color)
            .addFields(
				{ name: 'You', value: `${emojis[playerMoveNum]}`, inline: true},
                { name: 'BirdBox', value: `${emojis[computerMoveNum]}`, inline: true}
			)
            .setFooter({ text: footer });

        await interaction.reply({ embeds: [rpsEmbed] });

    },
    async executeClassic({message, args}, { embedColors }) {
		const validChoices = ['rock', 'paper', 'scissors', 'r', 'p', 's'];
		let playerChoice = args[0];
		
		//make sure they added a correct choice
		if(!validChoices.includes(playerChoice)) { message.reply('bruh it\'s literally the title of the game, you gotta use "rock", "paper", or "scissors".').catch(e => console.error(e)); return;}

		//replace choices with full versions so the logic is cleaner and the later message makes sense
		const emojifiedChoices = {r: ":rock:", rock: ":rock:", p: ":roll_of_paper:", paper: ":roll_of_paper:", s: ":scissors:", scissors: ":scissors:"};
		if (emojifiedChoices[playerChoice]) playerChoice = emojifiedChoices[playerChoice]

		//pick a random choice from the first three of validChoices, then use the emoji version
		const computerChoice = emojifiedChoices[validChoices[Math.floor(Math.random() * 2)]]

		//determine match result based on choices
		const matchResults = {
			":rock:": {":rock:": 'Tied', ":roll_of_paper:": 'Lost', ":scissors:": 'Won'},
			":roll_of_paper:": {":rock:": 'Won', ":roll_of_paper:": 'Tied', ":scissors:": 'Lost'},
			":scissors:": {":rock:": 'Lost', ":roll_of_paper:": 'Won', ":scissors:": 'Tied'}
		}
		const result = matchResults[playerChoice][computerChoice]

        let selectedColor;

		//set footer based on match result
        let footer;
		switch (result) {
			case "Won": footer = 'decent job chump'; selectedColor = embedColors.green; break;
			case "Tied": footer = 'kinda mid game ngl'; selectedColor = embedColors.yellow; break;
			case "Lost": footer = 'massive L'; selectedColor = embedColors.red; break;
		}

		//create embed and reply with it
        const rpsEmbed = new EmbedBuilder()
            .setTitle(`You ${result}!`)
            .setColor(selectedColor)
            .addFields(
				{ name: 'You', value: `${playerChoice}`, inline: true},
                { name: 'BirdBox', value: `${computerChoice}`, inline: true}
			)
            .setFooter({ text: footer });
		
        message.reply({ embeds: [rpsEmbed] }).catch(e => console.error(e));
    }
}
