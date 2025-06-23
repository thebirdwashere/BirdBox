import { Subcommand, CommandOption } from "src/utility/command.js";
import flags from "src/data/flags.json" with { type: "json" };
import { Flags } from "src/utility/types.js";
import { sleep } from "src/utility/utility.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, EmbedBuilder } from "discord.js";

const FLAGS = flags as Flags;

const flagsQuiz = new Subcommand({
	name: "quiz",
	description: "Given a country, guess its flag.",
	options: [
		new CommandOption({
			name: "difficulty",
			description: "Change how many flags are available to guess.",
			type: "string",
		}),
	],
	execute: async (ctx, opts) => { //MARK: game setup
		const difficultyOptions: Record<string, number> = FLAGS.difficulties.map(difficulty => difficulty.name.toLowerCase()).reduce((acc: Record<string, number>, current, i) => {
			acc[current] = i;
			return acc;
		}, {});

		const providedDifficulty = opts.string.get("difficulty");
		if (providedDifficulty != null && !difficultyOptions[providedDifficulty.toLowerCase()]) {
		const optionsFormatter = new Intl.ListFormat("en", {
			type: "conjunction",
		});
		const difficultyOptionsList = optionsFormatter.format(FLAGS.difficulties.map(difficulty => `\`${difficulty.name}\``));
		throw new Error(`Provided difficulty "${providedDifficulty}" is invalid. The available difficulty options are ${difficultyOptionsList}.`);
		}
		
		const selectedDifficulty = providedDifficulty != null ? FLAGS.difficulties[difficultyOptions[providedDifficulty.toLowerCase()]] : FLAGS.difficulties[0];
		const flagsNum = selectedDifficulty.flags;
		
		//get all flag names and emojis
		const countryNames = Object.keys(FLAGS.emojis);
		const countryFlags = Object.values(FLAGS.emojis).map((flag) => flag.emoji);
		
		//selects random flags and the correct flag
		//correct flag always first in the list, shuffle later to rectify this
		const guessFlags = sampleArray<string>(countryFlags, flagsNum);
		const rightFlagEmoji = guessFlags[0];
		const rightFlagCountry = countryNames[countryFlags.indexOf(rightFlagEmoji)];
		const rightFlag = FLAGS.emojis[rightFlagCountry];

		//add decoy flags if decoys in use
		if (selectedDifficulty.decoysAmount) {
			let decoyFlags = rightFlag.decoys.filter(flag => flag !== rightFlagEmoji);
			const decoyFlagsAmount = selectedDifficulty.decoysAmount;

			//starts at 1 so it never overwrites the correct answer
			for (let i = 1; i <= decoyFlagsAmount; i++) {
				const chosenDecoy = decoyFlags[Math.floor(Math.random() * decoyFlags.length)];

				//ensure this decoy isn't already an option
				//if it is, redo this step of the loop
				if (guessFlags.includes(chosenDecoy)) {
				i--; /*console.log(guessFlags, chosenDecoy);*/ continue;
				};

				//set decoy and remove it from the decoy options
				guessFlags[i] = chosenDecoy;
				decoyFlags = decoyFlags.filter((item) => item !== chosenDecoy);
			}
		}

		//shuffle flags
		const shuffledFlags = shuffleArray(guessFlags);

		//set numbers that display in the embed footer
		let remainingTime = 15;
		let peopleGuessed = 0;
		
		//create embed
		const flagEmbed = new EmbedBuilder()
			.setTitle(`What is the flag of ${rightFlagCountry}?`)
			.setFooter({text: `${peopleGuessed.toString()} guessed ● ${remainingTime.toString()} seconds left`})
			.setColor(Colors.Blue);

		//initialize array of rows of buttons
		const buttonRowArray: ActionRowBuilder<ButtonBuilder>[] = [];

		//for every flag
		for (let i = 0; i < flagsNum; i++) {
			const buttonRowNum = Math.floor(i / 4);

			//if row not currently created, create it
			if (!buttonRowArray[buttonRowNum]) {
				buttonRowArray[buttonRowNum] = new ActionRowBuilder();
			}

			//add button to row
			buttonRowArray[buttonRowNum].addComponents(
				new ButtonBuilder()
				.setCustomId(shuffledFlags[i])
				.setEmoji(shuffledFlags[i])
				.setStyle(ButtonStyle.Primary)
			);
		}

		//send embed
		await ctx.reply({embeds: [flagEmbed], components: buttonRowArray});
		if (ctx.lastReply == null) throw new Error("Could not locate last reply.");

		//collect button responses
		const buttonCollector = ctx.lastReply.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 15000,
		});

		//initialize arrays of correct and wrong users; used for point changes later
		const correctUsers: string[] = [];
		const wrongUsers: string[] = [ctx.user.id]; //automatically a loser, just in case you don't answer
		
		async function handleButtonInteraction(i: ButtonInteraction): Promise<void> { //MARK: handle guess
			const userId = i.user.id;

			//if user is correct
			if (i.customId == rightFlagEmoji && !correctUsers.includes(userId)) {
				//if user previously wrong, take them out of wrong array
				if (wrongUsers.includes(userId)) {
				wrongUsers.splice(wrongUsers.indexOf(userId), 1);
				}

				//add user to correct array
				correctUsers.push(userId);
			}

			//if user is wrong
			if (i.customId != rightFlagEmoji && !wrongUsers.includes(userId)) {
				//if user previously correct, take them out of correct array
				if (correctUsers.includes(userId)) {
				correctUsers.splice(correctUsers.indexOf(userId), 1);
				}

				//add user to wrong array
				wrongUsers.push(userId);
			}

			//calculate total answerers and display on embed
			peopleGuessed = correctUsers.length + wrongUsers.length;
			flagEmbed.setFooter({text: `${peopleGuessed.toString()} guessed ● ${remainingTime.toString()} seconds left`});
			
			await i.message.edit({ embeds: [flagEmbed] });
			await i.deferUpdate();
		}

		async function handleButtonTimeout(): Promise<void> { //MARK: game ended
			//for every button, disable it and make it red
			buttonRowArray.forEach((row) => {
				row.components.forEach(
					(button) => {
						button.setStyle(ButtonStyle.Danger).setDisabled(true);
					}
				);
			});

			//get index of correct flag and set to green
			const rightFlagIndex = shuffledFlags.indexOf(rightFlagEmoji);
			buttonRowArray[Math.floor(rightFlagIndex / 4)].components[rightFlagIndex % 4].setStyle(ButtonStyle.Success);

			await ctx.lastReply?.edit({embeds: [flagEmbed], components: buttonRowArray});

			//get values of points
			const pointsEarned = selectedDifficulty.earned;
			const pointsLost = selectedDifficulty.lost;

			//get correct and wrong users as a formatted list (with commas or "and" when necessary)
			const usersFormatter = new Intl.ListFormat("en", {
				type: "conjunction",
			});
			const correctUserString = usersFormatter.format(
				correctUsers.map((userId) => `<@${userId}>`)
			);
			const wrongUserString = usersFormatter.format(
				wrongUsers.map((userId) => `<@${userId}>`)
			);

			//create reply based on correct and wrong users
			let responseText = "";
			responseText += !correctUsers.length ? "Nobody got it right! \n" : `${correctUserString} got it right! gg *(+${pointsEarned.toString()} points)*\n`;
			responseText += !wrongUsers.length ? "That means nobody got it wrong... pretty good ig" : `That means ${wrongUserString} got it wrong, massive L *(-${pointsLost.toString()} points)*`;

			await ctx.lastReply?.reply(responseText);

			//TODO: Add config support 

			// //MARK: update stats

			// //runs on every correct user
			// for (const userId of correctUsers) {
			// 	let userStats = await db.get(`flags_stats.flag_quiz.${userId}`);

			// 	//default stats
			// 	if (!userStats)
			// 	userStats = {
			// 		wins: 0,
			// 		losses: 0,
			// 		current_streak: 0,
			// 		best_streak: 0,
			// 		points: 0,
			// 	};

			// 	//simple stat manipulation
			// 	userStats.wins++;
			// 	userStats.current_streak++;
			// 	userStats.points += pointsEarned;

			// 	//set new best streak if needed
			// 	if (userStats.current_streak > userStats.best_streak) {
			// 	userStats.best_streak = userStats.current_streak;
			// 	}

			// 	//enter into db
			// 	await db.set(`flags_stats.flag_quiz.${userId}`, userStats);
			// }

			// //runs on every wrong user
			// for (const userId of wrongUsers) {
			// 	let userStats = await db.get(`flags_stats.flag_quiz.${userId}`);

			// 	//default stats
			// 	if (!userStats)
			// 	userStats = {
			// 		wins: 0,
			// 		losses: 0,
			// 		current_streak: 0,
			// 		best_streak: 0,
			// 		points: 0,
			// 	};

			// 	//simple stat manipulation
			// 	userStats.losses++;
			// 	userStats.current_streak = 0;
			// 	userStats.points -= pointsLost;

			// 	await db.set(`flags_stats.flag_quiz.${userId}`, userStats);
			// }
		}
		
		buttonCollector.on("collect", (i: ButtonInteraction): void => void handleButtonInteraction(i) );
		buttonCollector.on("end", (_): void => void handleButtonTimeout() );

		while (remainingTime) { //MARK: handle timer
			//sleep for less than a second because of slight timer delay
			//and it's better to stall on 0 than for the quiz to end early
			//exact value chosen by vibes based on trial and error
			await sleep(800); 

			//subtract time and update on embed
			remainingTime -= 1;
			flagEmbed.setFooter({text: `${peopleGuessed.toString()} guessed ● ${remainingTime.toString()} seconds left`});

			await ctx.lastReply.edit({ embeds: [flagEmbed] });
		}

	},
});

export default flagsQuiz;

function sampleArray<T>(array: T[], sampleSize: number): T[] {
	const originalArray: T[] = [...array];
	let sampledArray: T[] = [];

	while (sampledArray.length < sampleSize) {
		const randomInt = Math.floor(Math.random() * originalArray.length);
		sampledArray = sampledArray.concat(originalArray.splice(randomInt, 1));
	}

	return sampledArray;
}

function shuffleArray<T>(array: T[]): T[] {
	const originalArray: T[] = [...array];
	let shuffledArray: T[] = [];

	while (originalArray.length) {
		const randomInt = Math.floor(Math.random() * originalArray.length);
		shuffledArray = shuffledArray.concat(originalArray.splice(randomInt, 1));
	}

	return shuffledArray;
}