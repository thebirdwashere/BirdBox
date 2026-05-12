import { Colors, EmbedBuilder } from "discord.js";
import { CommandOption, Subcommand } from "src/utility/command.js";
import { UserFlagStats } from "src/utility/types.js";

const FlagsStats = new Subcommand({
  name: "stats",
  description: "flags stats",
  options: [
    new CommandOption({
      name: "user",
      description: "The person to view the stats of. If not set, defaults to yourself.",
      type: "user",
      optional: true,
    }),
  ],
  contextmenu: {
    type: "user",
    label: "check flags stats",
    contextOption: "user",
  },
  execute: async (ctx, opts) => {
    const userChoice = opts.user.get("user") ?? ctx.user;

    //easter egg?
    if (userChoice.id === ctx.data.id) {
      await ctx.reply("hey, what're you looking at me for?");
      return;
    }

    //get stats of a specific user
    const userStats = await ctx.db.user.fetchOrUndefined(userChoice.id, "flagStats") as UserFlagStats | undefined;

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

    statsEmbed.setFooter({ text: "look at this sweaty nerd" });

    //add stats
    statsEmbed.addFields(
      {
        name: "Wins",
        value: `${userStats.wins.toString()} ${userStats.currentStreak === 1 ? "win" : "wins"}\n`,
        inline: true,
      },
      {
        name: "Losses",
        value: `${userStats.losses.toString()} ${userStats.currentStreak === 1 ? "loss" : "losses"}\n`,
        inline: true,
      },
      {
        name: "Win Percentage",
        value: `${Number(userStats.wins / (userStats.wins + userStats.losses))
          .toLocaleString(undefined, {style: "percent", minimumFractionDigits: 2,
          })} of games\n`,
        inline: true,
      },
      {
        name: "Points",
        value: `${userStats.points.toString()} points\n`,
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

export default FlagsStats;
