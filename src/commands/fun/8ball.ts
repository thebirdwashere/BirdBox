import { Command, CommandOption } from "src/utility/command.js";
import { Colors, EmbedBuilder } from "discord.js";
import footers from "../../data/footers.json" with { type: "json" };
import responses from "../../data/responses.json" with { type: "json" };
import { Footers, Responses } from "../../utility/types.js";

const FOOTERS = footers as Footers;
const RESPONSES = responses as Responses;

const Magic8Ball = new Command({
    name: "8ball",
    description: "Magic 8 Ball command: ask anything, but don't expect a straight answer.",
    options: [
        new CommandOption({
            name: "message",
            description: "Get a wise response...",
            type: "string",
        }),
    ],
    execute: async (ctx, opts) => {
        const message = opts.string.get("message");
        const randomResponse = RESPONSES.magic8ball[Math.floor(Math.random() * RESPONSES.magic8ball.length)];
        const randomFooter = FOOTERS.magic8ball[Math.floor(Math.random() * FOOTERS.magic8ball.length)];

        const responseEmbed = new EmbedBuilder()
            .setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256" })
            .setColor(Colors.Blue)
            .addFields(
				{ name: "You asked:", value: `"${message ?? "nothing"}"`}
			);
        
        if (typeof randomResponse == "string") {
            responseEmbed.setTitle(randomResponse);
            responseEmbed.setFooter({ text: randomFooter });
        } else {
            if ("url" in randomResponse) {
                responseEmbed
                    .setTitle(randomResponse.text)
                    .setURL(randomResponse.url ?? null);
            }

            if ("image" in randomResponse) {
                responseEmbed
                    .setTitle(randomResponse.text)
                    .setImage(randomResponse.image ?? null);
            } 

            if (randomResponse.credit) {
                responseEmbed.setFooter({ text: `${randomResponse.credit} - ${randomFooter}` });
            }
        }

        await ctx.reply({ embeds: [responseEmbed] });

    }
});

export default Magic8Ball;
