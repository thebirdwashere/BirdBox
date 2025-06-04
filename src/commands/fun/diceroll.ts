import { Command, CommandOption } from "src/utility/command.js";
import { Message } from "discord.js";
import { CommandContext } from "src/utility/context.js";
import { Options } from "src/utility/types.js";

const Diceroll = new Command({
    name: "diceroll",
    description: "Roll a die to get a random number quickly (or maybe not so quickly).",
        options: [
            new CommandOption({
                name: "sides",
                description: "The desired number of sides, providing a random number 1-n (inclusive). Defaults to 6.",
                type: "number",
            }),
        ],
    execute: async (ctx: CommandContext, opts: Options) => {
        console.log("before");
        console.log(opts.number.get("sides"));
        console.log("after");
        
        let sides = Number(opts.number.get("sides"));
        if (isNaN(sides)) sides = 6;

        if (sides > 2147483647) {
            await ctx.reply("bro that is WAY too many sides, tone it down a bit"); return;
        } else if (sides < 1) {
            await ctx.reply("bro i kinda need a positive number of faces"); return;
        } else if (sides !== Math.floor(sides)) {
            await ctx.reply("bro i kinda need an integer number of faces"); return;
        } else if (sides === 1) {
            await ctx.reply("bro i kinda need more than one face"); return;
        }

        //calculate random roll
        const mainResult = Math.floor(Math.random() * sides) + 1;
        
        //secondary result is needed for some trolls
        let secondaryResult = Math.floor(Math.random() * sides) + 1;
        while (secondaryResult === mainResult) { //ensure this is different from main
            secondaryResult = Math.floor(Math.random() * sides) + 1;}

        const trollOptions = [
            async () => { // Normal
                await ctx.reply(`:game_die: You rolled ${mainResult.toString()}!`);
            },
            async () => { // Off The Table
                await ctx.reply(`:game_die: The die fell off the table! It landed on ${mainResult.toString()} though, if you think it counts.`);
            },
            async () => { // Dog Ate My Die
                await ctx.reply(`:game_die: A dog just ate the die before I got a good look at it! I think it was ${mainResult.toString()}, though... or maybe ${secondaryResult.toString()}...`);
            },
            async () => { // Bad Math
                const lastReply: Message = await ctx.reply(`:game_die: You rolled ${mainResult.toString()}!`);

                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); // between two and eight seconds

                await lastReply.reply(`:game_die: Wait no, that's ${secondaryResult.toString()}. Not too good with numbers.`);
            },
            async () => { // Intense Shaking
                const lastReply: Message = await ctx.reply(":game_die: Hold on, let me shake them first.")
                .finally(() => {
                    if (ctx.channel.isSendable()) {
                        void ctx.channel.sendTyping(); //make birdbox show as typing
                    };
                });  

                //some funny commentary
                const randomSayings = [
                    "*shaking noises*",
                    "*shaking continues*",
                    "*intense shaking*",
                    "*still shaking*",
                    "*how long will this shaking last*",
                    "*vigorous shaking*",
                    "*the shaketh perserveres*",
                    "*con los terroristas*"
                ];

                //iterate an unpredictable number of times
                const MIN_ITERATIONS = 2;
                const MAX_ITERATIONS = 7;
                const iterations = Math.floor(Math.random() * (MAX_ITERATIONS - MIN_ITERATIONS) + MIN_ITERATIONS);

                for (let i = 0; i < iterations; i++) {
                    await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); //between two and eight seconds
                
                    //send a random saying
                    const chosenSaying = randomSayings[Math.floor(Math.random() * randomSayings.length)];
                    await ctx.send(chosenSaying)
                    .finally(() => {
                        if (ctx.channel.isSendable()) {
                            void ctx.channel.sendTyping(); //make birdbox show as typing
                        };
                    });
                }

                //one last sleep
                await sleep(Math.floor(Math.random() * (8000 - 2000) + 2000)); //between two and eight seconds

                //finally tell them what the result is
                await lastReply.reply(`:game_die: You rolled ${mainResult.toString()}!`);
            }
        ];

        const trollNum = Math.floor(Math.random() * trollOptions.length);
        await trollOptions[trollNum]();
    },
});

export default Diceroll;

function sleep(ms: number) : Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}