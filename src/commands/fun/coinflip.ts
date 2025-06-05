import { Message } from "discord.js";
import { Command, CommandOption } from "src/utility/command.js";

const Coinflip = new Command({
    name: "coinflip",
    description: "Flip a coin to make a decision easily (or maybe not so easily).",
    options: [
        new CommandOption({
            name: "heads",
            description: "The first option to choose between. Defaults to \"heads\".",
            type: "string",
            required: false,
        }),
        new CommandOption({
            name: "tails",
            description: "The second option to choose between. Defaults to \"tails\" or, if set, the inverse of heads.",
            type: "string",
            required: false,
        }),
    ],
    execute: async (ctx, opts) => {
        const heads = opts.string.get("heads");
        const tails = opts.string.get("tails");
        const onlyHeadsProvided = heads !== null && tails === null;

        const validOptions: string[] = [];
        validOptions[0] = heads ?? "heads";
        validOptions[1] = onlyHeadsProvided ? `**not** ${heads ?? ""}` : (tails ?? "tails");

        await ctx.send(validOptions[0]);
        await ctx.send(validOptions[1]);

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