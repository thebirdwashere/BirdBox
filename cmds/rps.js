/* TITLE: Rock Paper Scissors Command
 * AUTHORS: Matty, Bisly (Modifications)
 * DESCRIPTION: Play RPS against the computer! */

const { EmbedBuilder } = require("discord.js");
const { randomIntInRange } = require("../utils");

module.exports = {
	name: 'rps',
	description: 'Play rock paper scissors with the bot. Simple but fun!',
	execute({message, args}) {
		const validChoices = ['rock', 'paper', 'scissors', 'r', 'p', 's'];
		let playerChoice = args[0];
		
		//make sure they added a correct choice
		if(!validChoices.includes(playerChoice)) { message.channel.trysend('bruh it\'s literally the title of the game, you gotta use "rock", "paper", or "scissors".'); return;}

		//replace choices with full versions so the logic is cleaner and the later message makes sense
		const emojifiedChoices = {r: ":rock:", rock: ":rock:", p: ":roll_of_paper:", paper: ":roll_of_paper:", s: ":scissors:", scissors: ":scissors:"};
		if (emojifiedChoices[playerChoice]) playerChoice = emojifiedChoices[playerChoice]

		//pick a random choice from the first three of validChoices, then use the emoji version
		const computerChoice = emojifiedChoices[validChoices[randomIntInRange(0, 2)]]

		//determine match result based on choices
		const matchResults = {
			":rock:": {":rock:": 'Tied', ":roll_of_paper:": 'Lost', ":scissors:": 'Won'},
			":roll_of_paper:": {":rock:": 'Won', ":roll_of_paper:": 'Tied', ":scissors:": 'Lost'},
			":scissors:": {":rock:": 'Lost', ":roll_of_paper:": 'Won', ":scissors:": 'Tied'}
		}
		const result = matchResults[playerChoice][computerChoice]

		//set footer based on match result
        let footer;
		switch (result) {
			case "Won": footer = 'decent job chump'; break;
			case "Tied": footer = 'kinda mid game ngl'; break;
			case "Lost": footer = 'massive L'; break;
		}

		//create embed and reply with it
        const rpsEmbed = new EmbedBuilder()
            .setTitle(`You ${result}!`)
            .setColor(0x208ddd)
            .addFields(
				{ name: 'You', value: `${playerChoice}`, inline: true},
                { name: 'BirdBox', value: `${computerChoice}`, inline: true}
			)
            .setFooter({ text: footer });
		
        message.reply({ embeds: [rpsEmbed] });
	}
}
