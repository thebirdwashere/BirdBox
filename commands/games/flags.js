const {
  sampleArray,
  shuffleArray,
  sleep,
} = require("../../utils/scripts/util_scripts.js");
const { flags, difficulties } = require("../../utils/json/flags.json");
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SKUFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("flags")
    .setDescription("Guess some stuff about flags.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("quiz")
        .setDescription("Given a country, guess its flag.")
        .addStringOption((option) =>
          option
            .setName("difficulty")
            .setDescription("Change how many flags are available to guess.")
            .addChoices(
              {
                name: `${difficulties[0].name} (${difficulties[0].earned} points)`,
                value: "0",
              },
              {
                name: `${difficulties[1].name} (${difficulties[1].earned} points)`,
                value: "1",
              },
              {
                name: `${difficulties[2].name} (${difficulties[2].earned} points)`,
                value: "2",
              },
              {
                name: `${difficulties[3].name} (${difficulties[3].earned} points)`,
                value: "3",
              },
              {
                name: `${difficulties[4].name} (${difficulties[4].earned} points)`,
                value: "4",
              }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("View high scores across all BirdBox users.")
        .addStringOption((option) =>
          option
            .setName("statistic")
            .setDescription("Change what statistic you want to view.")
            .setRequired(true)
            .addChoices(
              { name: `points`, value: "points" },
              { name: `win percentage`, value: "win percentage" },
              { name: `best streak`, value: "best streak" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription("View stats of selected person.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The person to view stats of")
        )
    ),
  async execute(interaction, { client, embedColors, db }) {
    switch (
      interaction.options.getSubcommand() // Switch to handle different subcommands.
    ) {
      case "quiz": {
        const difficulty =
          difficulties[interaction.options?.getString("difficulty")] ??
          difficulties[0];
        const flagsNum = difficulty.flags;

        const countryNames = Object.keys(flags);
        const countryFlags = Object.values(flags)
          //.filter((flag) => flag.decoys.length > 0)
          .map((flag) => flag.emoji);

        const guessFlags = sampleArray(countryFlags, flagsNum);
        const rightFlagEmoji = guessFlags[0];
        const rightFlagCountry =
          countryNames[countryFlags.indexOf(rightFlagEmoji)];
        const rightFlag = flags[rightFlagCountry];

        //add decoy flags if on hard mode
        if (difficulty.usesDecoys) {
          let decoyFlags = rightFlag.decoys;

          for (let i = 0; i < decoyFlags.length; i++) {
            const chosenDecoy =
              decoyFlags[Math.floor(Math.random() * decoyFlags.length)];
            const chosenPosition =
              Math.floor(Math.random() * (guessFlags.length - 1)) + 1;

            guessFlags[chosenPosition] = chosenDecoy;

            decoyFlags = decoyFlags.filter((item) => item !== chosenDecoy);
          }
        }

        const shuffledFlags = shuffleArray(guessFlags);

        let remainingTime = 15;
        let peopleGuessed = 0;

        const flagEmbed = new EmbedBuilder()
          .setTitle(`What is the flag of ${rightFlagCountry}?`)
          .setFooter({
            text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`,
          })
          .setColor(embedColors.blue);

        let buttonRowArray = [];

        for (let i = 0; i < flagsNum; i++) {
          const buttonRowNum = Math.floor(i / 4);

          if (!buttonRowArray[buttonRowNum]) {
            buttonRowArray[buttonRowNum] = new ActionRowBuilder();
          }

          buttonRowArray[buttonRowNum].addComponents(
            new ButtonBuilder()
              .setCustomId(shuffledFlags[i])
              .setEmoji(shuffledFlags[i])
              .setStyle(ButtonStyle.Primary)
          );
        }

        const response = await interaction.reply({
          embeds: [flagEmbed],
          components: buttonRowArray,
        });

        const buttonCollector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 15000,
        });

        let correctUsers = [];
        let wrongUsers = [interaction.member.id]; //automatically a loser, just in case you don't answer

        buttonCollector.on("collect", async (i) => {
          const userId = i.member.id;
          if (i.customId == rightFlagEmoji && !correctUsers.includes(userId)) {
            if (wrongUsers.includes(userId)) {
              wrongUsers.splice(wrongUsers.indexOf(userId), 1);
            }

            correctUsers.push(userId);
          }

          if (i.customId != rightFlagEmoji && !wrongUsers.includes(userId)) {
            if (correctUsers.includes(userId)) {
              correctUsers.splice(correctUsers.indexOf(userId), 1);
            }
            wrongUsers.push(userId);
          }

          peopleGuessed = correctUsers.length + wrongUsers.length;
          flagEmbed.setFooter({
            text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`,
          });

          await response.edit({ embeds: [flagEmbed] });
          i.deferUpdate();
        });

        buttonCollector.on("end", async () => {
          buttonRowArray.forEach((row) => {
            row.components.forEach(async (button) => {
              await button.setStyle(ButtonStyle.Danger).setDisabled(true);
            });
          });

          const rightFlagIndex = shuffledFlags.indexOf(rightFlagEmoji);

          await buttonRowArray[Math.floor(rightFlagIndex / 4)].components[
            rightFlagIndex % 4
          ].setStyle(ButtonStyle.Success);

          await response.edit({
            embeds: [flagEmbed],
            components: buttonRowArray,
          });

          const pointsEarned = difficulty.earned;
          const pointsLost = difficulty.lost;

          const usersFormatter = new Intl.ListFormat("en", {
            type: "conjunction",
          });
          const correctUserString = usersFormatter.format(
            correctUsers.map((userId) => `<@${userId}>`)
          );
          const wrongUserString = usersFormatter.format(
            wrongUsers.map((userId) => `<@${userId}>`)
          );

          let responseText = "";

          switch (correctUsers.length) {
            case 0:
              responseText += `Nobody got it right! \n`;
              break;
            case 1:
              responseText += `${correctUserString} got it right! gg *(+${pointsEarned} points)*\n`;
              break;
            case 2:
              responseText += `${correctUserString} both got it right! gg *(+${pointsEarned} points)*\n`;
              break;
            default:
              responseText += `${correctUserString} all got it right! gg *(+${pointsEarned} points)*\n`;
              break;
          }
          switch (wrongUsers.length) {
            case 0:
              responseText += `That means nobody got it wrong... pretty good ig`;
              break;
            case 1:
              responseText += `That means ${wrongUserString} got it wrong, massive L *(-${pointsLost} points)*`;
              break;
            case 2:
              responseText += `That means ${wrongUserString} both got it wrong, massive L *(-${pointsLost} points)*`;
              break;
            default:
              responseText += `That means ${wrongUserString} all got it wrong, massive L *(-${pointsLost} points)*`;
              break;
          }

          await interaction.followUp(responseText);

          for (const userId of correctUsers) {
            let userStats = await db.get(`flags_stats.flag_quiz.${userId}`);

            if (!userStats)
              userStats = {
                wins: 0,
                losses: 0,
                current_streak: 0,
                best_streak: 0,
                points: 0,
              };

            userStats.wins++;
            userStats.current_streak++;
            userStats.points += pointsEarned;

            if (userStats.current_streak > userStats.best_streak) {
              userStats.best_streak = userStats.current_streak;
            }

            await db.set(`flags_stats.flag_quiz.${userId}`, userStats);
          }

          for (const userId of wrongUsers) {
            let userStats = await db.get(`flags_stats.flag_quiz.${userId}`);

            if (!userStats)
              userStats = {
                wins: 0,
                losses: 0,
                current_streak: 0,
                best_streak: 0,
                points: 0,
              };

            userStats.losses++;
            userStats.current_streak = 0;
            userStats.points -= pointsLost;

            await db.set(`flags_stats.flag_quiz.${userId}`, userStats);
          }
        });

        while (remainingTime) {
          await sleep(5000);

          remainingTime -= 5;
          flagEmbed.setFooter({
            text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`,
          });

          await response.edit({ embeds: [flagEmbed] });
        }

        break;
      }
      case "leaderboard": {
        const statisticChoice = interaction.options?.getString("statistic");

        const leaderboardEmbed = new EmbedBuilder()
          .setColor(embedColors.purple)
          .setFooter({ text: "look at all these amateurs" });

        const gameStats = await db.get(`flags_stats.flag_quiz`);

        if (!gameStats) {
          leaderboardEmbed.setTitle("Flag Quiz");
          leaderboardEmbed.setDescription(
            "huh, looks like there's nothing here"
          );
          return await interaction.reply({ embeds: [leaderboardEmbed] });
        }

        const statisticDisplays = {
          points: async () => {
            leaderboardEmbed.setTitle("Flag Quiz - Most Points");

            let pointsLeaderboardArray = [];
            let pointsLeaderboardText = "";

            for (const userId of Object.keys(gameStats)) {
              const userInfo = await client.users.fetch(userId);
              const userName = userInfo.username;

              gameStats[userId].name = userName;
              pointsLeaderboardArray.push(gameStats[userId]);
            }

            //sort by most points (kinda confusing)
            pointsLeaderboardArray.sort((a, b) => {
              if (a.points > b.points) return -1;
              else if (a.points < a.points) return 1;
              else return 0;
            });

            for (user of pointsLeaderboardArray) {
              pointsLeaderboardText += `${user.name}: **${user.points} points**\n`;
            }

            leaderboardEmbed.setDescription(pointsLeaderboardText);
          },
          "win percentage": async () => {
            leaderboardEmbed.setTitle("Flag Quiz - Highest Win Percentage");

            let percentLeaderboardArray = [];
            let percentLeaderboardText = "";

            for (const userId of Object.keys(gameStats)) {
              const userInfo = await client.users.fetch(userId);
              const userName = userInfo.username;

              const totalGames =
                gameStats[userId].wins + gameStats[userId].losses;
              const winPercentage = Number(
                gameStats[userId].wins / totalGames
              ).toLocaleString(undefined, {
                style: "percent",
                minimumFractionDigits: 2,
              });

              gameStats[userId].name = userName;
              gameStats[userId].win_percent = winPercentage;
              percentLeaderboardArray.push(gameStats[userId]);
            }

            //sort by most points (kinda confusing)
            percentLeaderboardArray.sort((a, b) => {
              if (a.win_percent > b.win_percent) return -1;
              else if (a.win_percent < a.win_percent) return 1;
              else return 0;
            });

            for (user of percentLeaderboardArray) {
              percentLeaderboardText += `${user.name}: **${user.win_percent} of games**\n`;
            }

            leaderboardEmbed.setDescription(percentLeaderboardText);
          },
          "best streak": async () => {
            leaderboardEmbed.setTitle("Flag Quiz - Longest Win Streak");

            let streakLeaderboardArray = [];
            let streakLeaderboardText = "";

            for (const userId of Object.keys(gameStats)) {
              const userInfo = await client.users.fetch(userId);
              const userName = userInfo.username;

              gameStats[userId].name = userName;
              streakLeaderboardArray.push(gameStats[userId]);
            }

            //sort by most points (kinda confusing)
            streakLeaderboardArray.sort((a, b) => {
              if (a.best_streak > b.best_streak) return -1;
              else if (a.best_streak < a.best_streak) return 1;
              else return 0;
            });

            for (user of streakLeaderboardArray) {
              if (user.best_streak == 1) {
                streakLeaderboardText += `${user.name}: **${user.best_streak} game**\n`;
              } else {
                streakLeaderboardText += `${user.name}: **${user.best_streak} games**\n`;
              }
            }

            leaderboardEmbed.setDescription(streakLeaderboardText);
          },
        };

        await statisticDisplays[statisticChoice]();

        const statSelector = new StringSelectMenuBuilder()
          .setCustomId("statSelector")
          .setPlaceholder("Select statistic...")
          .addOptions([
            new StringSelectMenuOptionBuilder()
              .setLabel("points")
              .setValue("points"),
            new StringSelectMenuOptionBuilder()
              .setLabel("win percentage")
              .setValue("win percentage"),
            new StringSelectMenuOptionBuilder()
              .setLabel("best streak")
              .setValue("best streak"),
          ]);

        const selectorRow = new ActionRowBuilder().addComponents(statSelector);

        const response = await interaction.reply({
          embeds: [leaderboardEmbed],
          components: [selectorRow],
        });

        const menuCollector = response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60000,
        });

        menuCollector.on("collect", async (i) => {
          const newStatisticChoice = i.values[0];

          await statisticDisplays[newStatisticChoice]();

          await response.edit({ embeds: [leaderboardEmbed] });

          await i.deferUpdate();
        });

        menuCollector.on("end", async (i) => {
          //disable the selector
          selectorRow.components[0].setDisabled(true);
          response.edit({ components: [selectorRow] });
        });

        break;
      }

      case "stats": {
        const userChoice = interaction.options?.getUser("user") || interaction.member.user;

        let userStats = await db.get(`flags_stats.flag_quiz.${userChoice?.id}`);

        const statsEmbed = new EmbedBuilder()
          .setColor(embedColors.purple)
          .setThumbnail(userChoice.avatarURL())
          .setFooter({ text: "look at this sweaty nerd" });

        if (!userStats) {
          statsEmbed.setTitle("Flag Quiz");
          statsEmbed.setDescription("huh, looks like there's nothing here");
          return await interaction.reply({ embeds: [statsEmbed] });
        }

        statsEmbed.setTitle(`Stats for ${userChoice.username}`);

        statsEmbed.addFields(
          {
            name: "Wins",
            value: `${userStats.wins} ${
              userStats.current_streak === 1 ? "win" : "wins"
            }\n`,
            inline: true,
          },
          {
            name: "Losses",
            value: `${userStats.losses} ${
              userStats.current_streak === 1 ? "loss" : "losses"
            }\n`,
            inline: true,
          },
          {
            name: "Win Percentage",
            value: `${Number(
              userStats.wins / (userStats.wins + userStats.losses)
            ).toLocaleString(undefined, {
              style: "percent",
              minimumFractionDigits: 2,
            })} of games\n`,
            inline: true,
          },
          {
            name: "Points",
            value: `${userStats.points} points\n`,
            inline: true,
          },
          {
            name: "Current Streak",
            value: `${userStats.current_streak} ${
              userStats.current_streak === 1 ? "game" : "games"
            }\n`,
            inline: true,
          },
          {
            name: "Best Streak",
            value: `${userStats.best_streak} ${
              userStats.best_streak === 1 ? "game" : "games"
            }\n`,
            inline: true,
          }
        );
        await interaction.reply({ embeds: [statsEmbed] });
        break;
      }
    }
  },
};
