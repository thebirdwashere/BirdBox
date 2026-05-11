import { ActionRowBuilder, Colors, ComponentType, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { CommandOption, Subcommand } from "src/utility/command.js";
import { NonEmptyArray, UserFlagStats } from "src/utility/types.js";

const STATISTICS = ["points", "win%", "streak"];
type StatisticString = "points" | "win%" | "streak";

const FlagsBoard = new Subcommand({
  name: "leaderboard",
  description: "View high scores across all BirdBox users.",
  options: [
    new CommandOption({
      name: "statistic",
      description: "Select which statistic you want to view. If not set, defaults to \"points\".",
      type: "string",
      optional: true,
      choices: STATISTICS as NonEmptyArray<string>,
    }),
  ],
  autocomplete: async (ctx) => {
    await ctx.respondStrings(STATISTICS);
  },
  execute: async (ctx, opts) => {
    //MARK: common
    const statisticChoice = (opts.string.get("statistic") ?? STATISTICS[0]) as StatisticString;

    //get game stats for every player
    const gameStats = ctx.db.user.fetchMap("flagStats") as Map<string, UserFlagStats>;

    //initialize leaderboard embed
    const leaderboardEmbed = new EmbedBuilder()
      .setColor(Colors.Purple);

    //end execution if no stats found
    if (gameStats.size < 1) {
      leaderboardEmbed.setTitle("Flag Quiz");
      leaderboardEmbed.setDescription("huh, looks like there's nothing here");
      
      await ctx.reply({ embeds: [leaderboardEmbed] });
      return;
    }

    //setup
    leaderboardEmbed.setFooter({ text: "look at all these amateurs" });
    let leaderboardArray: {
      name: string,
      value: number,
      display: string,
    }[] = [];
    
    //different stat display functions
    //note: this is an object and not a switch statement for later access
    //when selecting via message selector menu
    function finalizeEmbed(): void {
      let newText = "";

      //sort by most (kinda confusing)
      leaderboardArray.sort((a, b) => {
        if (a.value > b.value) return -1;
        else if (a.value < b.value) return 1;
        else return 0;
      });

      //concat onto a single string
      for (const user of leaderboardArray) {
        newText += `${user.name}: **${user.display}**\n`;
      }
      
      //add to embed
      leaderboardEmbed.setDescription(newText);
    }

    const statisticDisplays = {
      "points": async () => { //MARK: points board
        leaderboardEmbed.setTitle("Flag Quiz - Most Points");

        leaderboardArray = [];

        //add username to each user's stats
        for (const userId of gameStats.keys()) {
          const userInfo = await ctx.data.client.users.fetch(userId);
          const userName = userInfo.username;

          const userStats = gameStats.get(userId);
          if (userStats === undefined) continue;
          
          //push to centralized array
          leaderboardArray.push({
            name: userName, 
            value: userStats.points,
            display: `${userStats.points.toString()} points`
          });
        }

        finalizeEmbed();
      },
      "win%": async () => { //MARK: win% board
        leaderboardEmbed.setTitle("Flag Quiz - Highest Win Percentage");

        leaderboardArray = [];

        //add username to each user's stats
        for (const userId of gameStats.keys()) {
          const userInfo = await ctx.data.client.users.fetch(userId);
          const userName = userInfo.username;

          const userStats = gameStats.get(userId);
          if (userStats === undefined) continue;

          //some calculated stats too
          const totalGames = userStats.wins + userStats.losses;
          const winPercentage = Number(userStats.wins / totalGames);

          //push to centralized array
          leaderboardArray.push({
            name: userName, 
            value: winPercentage,
            display: `${winPercentage.toLocaleString(undefined,{style: "percent", minimumFractionDigits:2})} of games`
          });
        }

        finalizeEmbed();
      },
      "streak": async () => { //MARK: streak board
        leaderboardEmbed.setTitle("Flag Quiz - Longest Win Streak");

        leaderboardArray = [];

        //add username to each user's stats
        for (const userId of gameStats.keys()) {
          const userInfo = await ctx.data.client.users.fetch(userId);
          const userName = userInfo.username;

          const userStats = gameStats.get(userId);
          if (userStats === undefined) continue;

          //push to centralized array
          leaderboardArray.push({
            name: userName,
            value: userStats.bestStreak,
            display: `${userStats.bestStreak.toString()} game${userStats.bestStreak > 1 ? "s" : ""}`
          });
        }

        finalizeEmbed();
      }
    };

    //execute correct statistic display
    await statisticDisplays[statisticChoice]();
    
    //MARK: selector
    const boardSelector = new StringSelectMenuBuilder()
      .setCustomId("boardSelector")
      .setPlaceholder("Select leaderboard statistic...")
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel("points")
          .setValue("points"),
        new StringSelectMenuOptionBuilder()
          .setLabel("win%")
          .setValue("win%"),
        new StringSelectMenuOptionBuilder()
          .setLabel("streak")
          .setValue("streak"),
      ]);

    //boilerplate for sending the message
    const selectorRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(boardSelector);

    const response = await ctx.reply({ embeds: [leaderboardEmbed], components: [selectorRow] });

    const menuCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    async function handleSelectorInteraction(i: StringSelectMenuInteraction): Promise<void> {
      //update for new statistic
      const newStatisticChoice = i.values[0] as StatisticString;
      await statisticDisplays[newStatisticChoice]();

      //update message
      await response.edit({ embeds: [leaderboardEmbed] });
      await i.deferUpdate();
    };

    async function handleSelectorTimeout(): Promise<void> {
    //disable the selector
      selectorRow.components[0].setDisabled(true);
      await response.edit({ components: [selectorRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    menuCollector.on("collect", async (i: StringSelectMenuInteraction) => { await handleSelectorInteraction(i); });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    menuCollector.on("end", async (_) => { await handleSelectorTimeout(); });
  },
});

export default FlagsBoard;
