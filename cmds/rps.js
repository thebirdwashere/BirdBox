/* TITLE: Rock Paper Scissors Command
 * AUTHORS: Matty, Bisly (Modifications)
 * DESCRIPTION: Play RPS against the computer! */

const { randomIntInRange } = require("../utils");

module.exports = {
	name: 'rps',
	description: 'Play a game of Rock Paper Scissors against the computer!',
	execute({message, args}) {
		const validChoices = ['rock', 'paper', 'scissors', 'r', 'p', 's'];
		let playerChoice = args[0];
		
		if(!validChoices.includes(playerChoice)) { message.channel.trysend('Invalid move. Try again and use "rock", "paper", or "scissors".'); return;}

		//replace choices with full versions so the logic is cleaner and the later message makes sense
		const abbreviatedChoices = {r: "rock", p: "paper", s: "scissors"}
		abbreviatedChoices[playerChoice] && (playerChoice = abbreviatedChoices[playerChoice])

		const computerNumChoice =  randomIntInRange(0, 2);

		/*
		*	0 = rock
		*	1 = paper
		*	2 = scissors
		*/

		const computerChoice = validChoices[computerNumChoice]
		let playerNumChoice;

		switch(playerChoice) {
			case 'rock':
				playerNumChoice = 0; break;
			case 'paper':
				playerNumChoice = 1; break;
			case 'scissors':
				playerNumChoice = 2; break;
		}

		if (playerNumChoice == computerNumChoice) {var result = 'tied';}
		else if (((playerNumChoice - computerNumChoice) + 3) % 3 == 1) {var result = 'won';} //this works, trust me bro, stackoverlow told me it did
		else {var result = 'lost';}



		message.tryreply(`Congrats, you ${result}! The computer selected ${computerChoice} and you selected ${playerChoice}.`);
	}
}
