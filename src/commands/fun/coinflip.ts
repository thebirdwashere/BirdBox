import { Message } from "discord.js";
import { Command } from "src/utility/command.js";

const Coinflip = new Command({
    name: "coinflip",
    description: "Flip a coin to make a decision easily (or maybe not so easily).",
    execute: async (ctx) => {
        //let heads = interaction.options?.getString('heads');
        //let tails = interaction.options?.getString('tails');
        const validOptions = ["heads", "tails"];

        // if(heads && tails) {
        //     validOptions = [heads, tails];
        // } else if (heads) {
        //     validOptions = [heads, `**not** ${heads}`];
        // } else {
        //        validOptions = ['heads', 'tails'];
        // }

        const optionNum = Math.floor(Math.random() * validOptions.length);

        const trollOptions = [
            async () => { // Normal
                await ctx.reply(`:coin: Your result is "${validOptions[optionNum]}"!`);
            },
            async () => { // Off The Table
                await ctx.reply(`:coin: Messy flip, and the coin fell on the ground! The result was "${validOptions[optionNum]}", unless you want to try again.`);
            },
            async () => { // Dog Ate My Coin
                await ctx.reply(`:coin: A dog just ate the coin before I got a good look at it! I think it was "${validOptions[optionNum]}", though... or maybe not...`);
            },
            async () => { // Bad Memory
                const lastReply: Message = await ctx.reply(`:coin: Your result is "${validOptions[optionNum]}"!`);

                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); // between two and eight seconds

                if (validOptions[0] === "heads" && validOptions[1] === "tails") {
                    await lastReply.reply(`:coin: Wait, no, that would be "${validOptions[optionNum ^ 1]}". My eyesight isn't the best.`);
                } else {
                    await lastReply.reply(`:coin: Wait, no, that would be "${validOptions[optionNum ^ 1]}". I forgot which one was which.`);
                }
            }
        ];

        const trollNum = Math.floor(Math.random() * trollOptions.length);

        //credit to umadkek for this one
        const rareCase = Math.floor( Math.random() * 6000 );

        if ( 2999.5 < rareCase && rareCase < 3000.5 ) {
            await ctx.reply(":coin: Your result is... what???? it landed on the edge??");
        } else {
            await trollOptions[trollNum]();
        }
    },
});

export default Coinflip;

function sleep(ms: number) : Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}