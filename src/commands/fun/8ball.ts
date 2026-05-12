import { Command, CommandOption } from "src/utility/command.js";
import { Colors, EmbedBuilder } from "discord.js";
import footers from "src/data/footers.json" with { type: "json" };
import responses from "src/data/8ball.json" with { type: "json" };
import { Footers, EightBallResponses } from "src/utility/types.js";
import { randomChoice } from "src/utility/utility.js";

const FOOTERS = footers as Footers;
const RESPONSES = responses as EightBallResponses;

const Magic8Ball = new Command({
  name: "8ball",
  description:
    "Magic 8 Ball command: ask anything, but don't expect a straight answer.",
  options: [
    new CommandOption({
      name: "message",
      description: "Get a wise response...",
      type: "string",
    }),
  ],
  contextmenu: {
    label: "ask 8ball",
    type: "message",
    contextOption: "message",
  },
  execute: async (ctx, opts) => {
    const message = opts.string.get("message");
    if (!message)
      throw new Error("Could not locate message.");
    
    if (message.length && message.length > 1000)
      await ctx.reply("bro that message is WAY too long, i aint reading allat");
    
    const randomResponse =
      RESPONSES[
        Math.floor(Math.random() * RESPONSES.length)
      ];
    const randomFooter = randomChoice(FOOTERS.magic8ball);

    const responseEmbed = new EmbedBuilder()
      .setAuthor({
        name: "BirdBox",
        iconURL:
          "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256",
      })
      .setColor(Colors.Blue)
      .addFields({ name: "You asked:", value: `"${message}"` });

    if (typeof randomResponse == "string") {
      responseEmbed.setTitle(randomResponse);
      responseEmbed.setFooter({ text: randomFooter });
    } else {
      responseEmbed
        .setTitle(randomResponse.text)
        .setURL(randomResponse.url ?? null);

      if (randomResponse.image !== undefined)
        responseEmbed
          .setTitle(randomResponse.text)
          .setImage(randomResponse.image ?? null);

      if (randomResponse.credit !== undefined)
        responseEmbed.setFooter({
          text: `${randomResponse.credit} - ${randomFooter}`,
        });
    }

    await ctx.reply({ embeds: [responseEmbed] });
  },
});

export default Magic8Ball;
