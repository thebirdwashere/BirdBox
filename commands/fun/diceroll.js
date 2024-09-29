const { sleep } = require("../../utils/scripts/util_scripts.js");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('diceroll')
		.setDescription('Roll a die to get a random number quickly (or maybe not so quickly).')
        .addStringOption(option =>
			option
				.setName('sides')
				.setDescription('How many sides you want on the rolled die.')
        ),
    async execute(interaction) {
        
        let sides = interaction.options?.getString('sides') ?? 6; 

        if (sides > 2147483647) {
            return interaction.reply({content: "bro that is WAY too many sides, tone it down a bit", ephemeral: true});
        } else if (sides < 1) {
            return interaction.reply({content: `bro i kinda need a positive number of faces`, ephemeral: true});
        } else if (sides != Math.floor(sides)) {
            return interaction.reply({content: `bro i kinda need an integer number of faces`, ephemeral: true});
        }

        //calculate random roll
        const mainResult = Math.floor(Math.random() * sides) + 1;
        
        //secondary result is needed for some trolls
        let secondaryResult = Math.floor(Math.random() * sides) + 1;
        while (secondaryResult === mainResult) { //ensure this is different from main
            secondaryResult = Math.floor(Math.random() * sides) + 1;}

        const trollOptions = [
            async () => { // Normal
                await interaction.reply(`:game_die: You rolled ${mainResult}!`);
            },
            async () => { // Off The Table
                await interaction.reply(`:game_die: The die fell off the table! It landed on ${mainResult} though, if you think it counts.`)
            },
            async () => { // Dog Ate My Die
                await interaction.reply(`:game_die: A dog just ate the die before I got a good look at it! I think it was ${mainResult}, though... or maybe ${secondaryResult}...`);
            },
            async () => { // Bad Math
                await interaction.reply(`:game_die: You rolled ${mainResult}!`);

                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); // between two and eight seconds
                await interaction.followUp(`:game_die: Wait no, that's ${secondaryResult}. Not too good with numbers.`);
            },
            async () => { // Intense Shaking
                await interaction.reply(`:game_die: Hold on, let me shake them first.`)
                .finally(() => interaction.channel.sendTyping()); //make birdbox show as typing

                //some funny commentary
                randomSayings = [
                "*shaking noises*",
                "*shaking continues*",
                "*intense shaking*",
                "*still shaking*",
                "*how long will this shaking last*",
                "*vigorous shaking*",
                "*the shaketh perserveres*",
                "*con los terroristas*"
                ]

                //iterate an unpredictable number of times
                const MIN_ITERATIONS = 2
                const MAX_ITERATIONS = 7
                const iterations = Math.floor(Math.random() * (MAX_ITERATIONS - MIN_ITERATIONS) + MIN_ITERATIONS)

                for (let i = 0; i < iterations; i++) {
                    await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); //between two and eight seconds
                
                    //send a random saying
                    chosenSaying = randomSayings[Math.floor(Math.random() * randomSayings.length)];
                    await interaction.channel.send(chosenSaying)
                    .finally(() => interaction.channel.sendTyping());  //make birdbox show as typing
                }

                //one last sleep
                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); //between two and eight seconds

                //finally tell them what the result is
                await interaction.followUp(`:game_die: You rolled ${mainResult}!`);
            }
        ]

        const trollNum = Math.floor(Math.random() * trollOptions.length);
        trollOptions[trollNum]();

    },
    async executeClassic({message, args}) {
        
        let sides = args[0] ?? 6
        if (sides > 2147483647) return message.channel.send("bro that is WAY too many sides, tone it down a bit")

        if (sides < 1) {
            message.reply(`bro i kinda need a positive number of faces`);
            return;
        } else if (sides != Math.floor(sides)) {
            message.reply(`bro i kinda need an integer number of faces`);
            return;
        }

        //calculate random roll
        const mainResult = Math.floor(Math.random() * sides) + 1;
        
        //secondary result is needed for some trolls
        let secondaryResult = Math.floor(Math.random() * sides) + 1;
        while (secondaryResult === mainResult) { //ensure this is different from main
            secondaryResult = Math.floor(Math.random() * sides) + 1;}

        const trollOptions = [
            async () => { // Normal
                await message.reply(`:game_die: You rolled ${mainResult}!`);
            },
            async () => { // Off The Table
                await message.reply(`:game_die: The die fell off the table! It landed on ${mainResult} though, if you think it counts.`)
            },
            async () => { // Dog Ate My Die
                await message.reply(`:game_die: A dog just ate the die before I got a good look at it! I think it was ${mainResult}, though... or maybe ${secondaryResult}...`);
            },
            async () => { // Bad Math
                const original = await message.reply(`:game_die: You rolled ${mainResult}!`);

                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); // between two and eight seconds
                await original.reply(`:game_die: Wait no, that's ${secondaryResult}. Not too good with numbers.`);
            },
            async () => { // Intense Shaking
                const original = await message.reply(`:game_die: Hold on, let me shake them first.`)
                .finally(() => message.channel.sendTyping()); //make birdbox show as typing

                //some funny commentary
                randomSayings = [
                "*shaking noises*",
                "*shaking continues*",
                "*intense shaking*",
                "*still shaking*",
                "*how long will this shaking last*",
                "*vigorous shaking*",
                "*the shaketh continues*",
                "*con los terroristas*"
                ]

                //iterate an unpredictable number of times
                const MIN_ITERATIONS = 2
                const MAX_ITERATIONS = 7
                const iterations = Math.floor(Math.random() * (MAX_ITERATIONS - MIN_ITERATIONS) + MIN_ITERATIONS)

                for (let i = 0; i < iterations; i++) {
                    await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); //between two and eight seconds
                
                    //send a random saying
                    chosenSaying = randomSayings[Math.floor(Math.random() * randomSayings.length)];
                    await message.channel.send(chosenSaying)
                    .finally(() => message.channel.sendTyping());  //make birdbox show as typing
                }

                //one last sleep
                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); //between two and eight seconds

                //finally tell them what the result is
                await original.reply(`:game_die: You rolled ${mainResult}!`);
            }
        ]

        const trollNum = Math.floor(Math.random() * trollOptions.length);
        trollOptions[trollNum]();
 
    }
}

