import { Command, CommandOption } from "src/utility/command.js";
import { EmbedBuilder, Colors } from "discord.js";

const RPS = new Command({
    name: "rps",
    description: "Play Rock, Paper, Scissors with the bot. Simple and pure fun.",
    options: [
        new CommandOption({
            name: "move",
            description: "Your move to play.",
            type: "string"
        }),
    ],
    execute: async (ctx, opts) => {
        const moveNames = ["rock", "paper", "scissors"];
        const moveAbbreviations = moveNames.map(item => item[0]);
        const validMoves = moveNames.concat(moveAbbreviations);
        const emojis = [":rock:", ":roll_of_paper:", ":scissors:"];

        const playerMove = opts.string.get("move");
        const computerMove = moveNames[Math.floor(Math.random() * moveNames.length)];
        let result, footer, color;

        if(!validMoves.includes(playerMove ?? "undefined")) throw new Error("Move provided is not `rock`, `paper`, `scissors`, `r`, `p`, or `s`.");
        
        const playerMoveNum = validMoves.indexOf(playerMove ?? "undefined") % moveNames.length;

        const computerMoveNum = moveNames.indexOf(computerMove);

        if (playerMoveNum === computerMoveNum) {result = "You Tied!"; footer = "kinda mid game ngl"; color = Colors.Yellow;}
		else if (((playerMoveNum - computerMoveNum) + 3) % 3 === 1) {result = "You Won!"; footer = "decent job chump"; color = Colors.Green;}
		else {result = "You Lost!"; footer = "massive L";  color = Colors.Red;}

        const rpsEmbed = new EmbedBuilder()
            .setTitle(result)
            .setColor(color)
            .addFields(
				{ name: "You", value: emojis[playerMoveNum], inline: true},
                { name: "BirdBox", value: emojis[computerMoveNum], inline: true}
			)
            .setFooter({ text: footer });

        await ctx.reply({ embeds: [rpsEmbed] });
    },
});

export default RPS;
