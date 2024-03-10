const { sleep } = require("../../utils/scripts/util_scripts.js");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Get the bot to flip a coin!')
        .addStringOption(option =>
			option
				.setName('heads')
				.setDescription('The first option to choose from.')
        )
        .addStringOption(option =>
			option
				.setName('tails')
				.setDescription('The second option to choose from.')
        ),
    async execute(interaction) {
        
        let heads = interaction.options?.getString('heads');
        let tails = interaction.options?.getString('tails');
        let validOptions;

        if(heads && tails) {
            validOptions = [heads, tails];
        } else if (heads) {
            validOptions = [heads, `**not** ${heads}`];
        } else {
            validOptions = ['heads', 'tails'];
        }

        const optionNum = Math.floor(Math.random() * validOptions.length);

        const trollOptions = [
            async () => { // Normal
                await interaction.reply(`:coin: Your result is "${validOptions[optionNum]}"!`);
            },
            async () => { // Off The Table
                await interaction.reply(`:coin: Messy flip, and the coin fell on the ground! The result was "${validOptions[optionNum]}", unless you want to try again.`)
            },
            async () => { // Dog Ate My Coin
                await interaction.reply(`:coin: A dog just ate the coin before I got a good look at it! I think it was "${validOptions[optionNum]}", though... or maybe "${validOptions[optionNum ^ 1]}"...`);
            },
            async () => { // Bad Memory
                await interaction.reply(`:coin: Your result is "${validOptions[optionNum]}"!`);

                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); // between two and eight seconds

                if (validOptions[0] === 'heads' && validOptions[1] === 'tails') {
                    await interaction.followUp(`:coin: Wait, no, that would be "${validOptions[optionNum ^ 1]}". My eyesight isn't the best.`);
                } else {
                    await interaction.followUp(`:coin: Wait, no, that would be "${validOptions[optionNum ^ 1]}". I forgot which one was which.`);
                }
            }
        ]

        const trollNum = Math.floor(Math.random() * trollOptions.length);
        trollOptions[trollNum]();
        
    },
    async executeClassic({message, args, strings}) {
        
        let heads = strings[0];
        let tails = strings[1];
        let validOptions;

        if(heads && tails) {
            validOptions = [heads, tails];
        } else if (heads) {
            validOptions = [heads, `**not** ${heads}`];
        } else {
            validOptions = ['heads', 'tails'];
        }

        const optionNum = Math.floor(Math.random() * validOptions.length);

        const trollOptions = [
            async () => { // Normal
                await message.reply(`:coin: Your result is "${validOptions[optionNum]}"!`);
            },
            async () => { // Off The Table
                await message.reply(`:coin: Messy flip, and the coin fell on the ground! The result was "${validOptions[optionNum]}", unless you want to try again.`)
            },
            async () => { // Dog Ate My Coin
                await message.reply(`:coin: A dog just ate the coin before I got a good look at it! I think it was "${validOptions[optionNum]}", though... or maybe "${validOptions[optionNum ^ 1]}"...`);
            },
            async () => { // Bad Memory
                let replyMessage = await message.reply(`:coin: Your result is "${validOptions[optionNum]}"!`);

                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); // between two and eight seconds

                if (validOptions[0] === 'heads' && validOptions[1] === 'tails') {
                    await replyMessage.reply(`:coin: Wait, no, that would be "${validOptions[optionNum ^ 1]}." My eyesight isn't the best.`);
                } else {
                    await replyMessage.reply(`:coin: Wait, no, that would be "${validOptions[optionNum ^ 1]}." I forgot which one was which.`);
                }
            }
        ]

        const trollNum = Math.floor(Math.random() * trollOptions.length);
        trollOptions[trollNum]();
        
    }
}