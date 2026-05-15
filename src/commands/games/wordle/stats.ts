import { Colors, EmbedBuilder } from "discord.js";
import { CommandOption, Subcommand } from "src/utility/command.js";
import { UserWordleStats } from "src/utility/types.js";

const WordleStats = new Subcommand({
  name: "stats",
  description: "View stats of the selected person.",
  options: [
    new CommandOption({
      name: "user",
      description: "The person to view the stats of. If not set, defaults to yourself.",
      type: "user",
      optional: true,
    }),
  ],
  execute: async (ctx, opts) => {
    const userChoice = opts.user.get("user") ?? ctx.user;

    //easter egg?
    if (userChoice.id === ctx.data.id) {
      await ctx.reply("hey, what're you looking at me for?");
      return;
    }

    //get stats of a specific user
    const userStats = await ctx.db.user.fetchOrUndefined(userChoice.id, "wordleStats") as UserWordleStats | undefined;

    //initialize embed
    const statsEmbed = new EmbedBuilder()
      .setTitle(`Stats for ${userChoice.username}`)
      .setColor(Colors.Purple)
      .setThumbnail(userChoice.avatarURL());

    //end execution if no stats found
    if (userStats === undefined) {
      statsEmbed.setDescription("huh, looks like there's nothing here");
      await ctx.reply({ embeds: [statsEmbed] });
      return;
    }

    //title with user name
    statsEmbed.setFooter({ text: "look at this sweaty nerd" });

    const regularStats = Object.entries(userStats.guessStats)
      .filter(data => data[0] !== "loss");

    const regularStatsFormatted = regularStats
      .map(([guesses, stat]) => `${guesses} guesses: ${stat.toString()}\n`)
      .join(" ");
    
    const losses = userStats.guessStats.loss;
    const lossesFormatted = `Losses: ${losses.toString()}`;
    
    statsEmbed.setDescription(regularStatsFormatted + lossesFormatted);

    const wins = regularStats.reduce((acc, [_, stat]) => acc + stat, 0);
    const winPercentage = (wins / wins + losses).toLocaleString(undefined,{style: "percent", minimumFractionDigits:2});

    //add stats
    statsEmbed.addFields(
      {
        name: "Win Percentage",
        value: `${winPercentage} of games\n`,
        inline: true,
      },
      {
        name: "Current Streak",
        value: `${userStats.currentStreak.toString()} ${userStats.currentStreak === 1 ? "game" : "games"}\n`,
        inline: true,
      },
      {
        name: "Best Streak",
        value: `${userStats.bestStreak.toString()} ${userStats.bestStreak === 1 ? "game" : "games"}\n`,
        inline: true,
      }
    );

    await ctx.reply({ embeds: [statsEmbed] });
  },
});

export default WordleStats;
