const { sampleArray, shuffleArray, sleep } = require("../../utils/scripts/util_scripts.js");
const { flags, difficulties } = require("../../utils/json/flags.json");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SKUFlags} = require("discord.js");

module.exports = { //MARK: command data
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
    
    switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
      case 'quiz': { //MARK: quiz subcommand
        const difficulty = difficulties[interaction.options?.getString('difficulty')] ?? difficulties[0]
        const flagsNum = difficulty.flags;
        
        //get all flag names and emojis
        const countryNames = Object.keys(flags);
        const countryFlags = Object.values(flags).map((flag) => flag.emoji);
        
        //selects random flags and the correct flag
        //correct flag always first in the list, shuffle later to rectify this
        const guessFlags = sampleArray(countryFlags, flagsNum);
        const rightFlagEmoji = guessFlags[0];
        const rightFlagCountry = countryNames[countryFlags.indexOf(rightFlagEmoji)];
        const rightFlag = flags[rightFlagCountry];

        //add decoy flags if decoys in use
        if (difficulty.decoysAmount) {
          let decoyFlags = rightFlag.decoys.filter(flag => flag !== rightFlagEmoji);
          const decoyFlagsAmount = difficulty.decoysAmount;

          //starts at 1 so it never overwrites the correct answer
          for (let i = 1; i <= decoyFlagsAmount; i++) {
            const chosenDecoy = decoyFlags[Math.floor(Math.random() * decoyFlags.length)];

            //ensure this decoy isn't already an option
            //if it is, redo this step of the loop
            if (guessFlags.includes(chosenDecoy)) {
              i--; console.log(guessFlags, chosenDecoy); continue;
            };

            //set decoy and remove it from the decoy options
            guessFlags[i] = chosenDecoy;
            decoyFlags = decoyFlags.filter((item) => item !== chosenDecoy);
          }
        }

        //shuffle flags
        const shuffledFlags = shuffleArray(guessFlags);

        //set numbers that display in the embed footer
        let remainingTime = 15;
        let peopleGuessed = 0;
        
        //create embed
        const flagEmbed = new EmbedBuilder()
          .setTitle(`What is the flag of ${rightFlagCountry}?`)
          .setFooter({text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`})
          .setColor(embedColors.blue);

        //initialize array of rows of buttons
        let buttonRowArray = [];

        //for every flag
        for (let i = 0; i < flagsNum; i++) {
          const buttonRowNum = Math.floor(i / 4);

          //if row not currently created, create it
          if (!buttonRowArray[buttonRowNum]) {
            buttonRowArray[buttonRowNum] = new ActionRowBuilder();
          }

          //add button to row
          buttonRowArray[buttonRowNum].addComponents(
            new ButtonBuilder()
              .setCustomId(shuffledFlags[i])
              .setEmoji(shuffledFlags[i])
              .setStyle(ButtonStyle.Primary)
          );
        }

        //send embed
        const response = await interaction.reply({embeds: [flagEmbed], components: buttonRowArray})

        //collect button responses
        const buttonCollector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 15000,
        });

        //initialize arrays of correct and wrong users; used for point changes later
        let correctUsers = [];
        let wrongUsers = [interaction.member.id]; //automatically a loser, just in case you don't answer
        
        buttonCollector.on("collect", async (i) => { //MARK: handle guess
          const userId = i.member.id;

          //if user is correct
          if (i.customId == rightFlagEmoji && !correctUsers.includes(userId)) {
            //if user previously wrong, take them out of wrong array
            if (wrongUsers.includes(userId)) {
              wrongUsers.splice(wrongUsers.indexOf(userId), 1);
            }

            //add user to correct array
            correctUsers.push(userId);
          }

          //if user is wrong
          if (i.customId != rightFlagEmoji && !wrongUsers.includes(userId)) {
            //if user previously correct, take them out of correct array
            if (correctUsers.includes(userId)) {
              correctUsers.splice(correctUsers.indexOf(userId), 1);
            }

            //add user to wrong array
            wrongUsers.push(userId);
          }

          //calculate total answerers and display on embed
          peopleGuessed = correctUsers.length + wrongUsers.length;
          flagEmbed.setFooter({text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`})
          
          await response.edit({ embeds: [flagEmbed] });
          i.deferUpdate();
        });

        buttonCollector.on("end", async () => { //MARK: game ended
          //for every button, disable it and make it red
          buttonRowArray.forEach((row) => {
            row.components.forEach(async (button) => {
              await button.setStyle(ButtonStyle.Danger).setDisabled(true);
            });
          });

          //get index of correct flag and set to green
          const rightFlagIndex = shuffledFlags.indexOf(rightFlagEmoji);
          await buttonRowArray[Math.floor(rightFlagIndex / 4)].components[rightFlagIndex % 4].setStyle(ButtonStyle.Success)

          await response.edit({embeds: [flagEmbed], components: buttonRowArray})

          //get values of points
          const pointsEarned = difficulty.earned;
          const pointsLost = difficulty.lost;

          //get correct and wrong users as a formatted list (with commas or "and" when necessary)
          const usersFormatter = new Intl.ListFormat("en", {
            type: "conjunction",
          });
          const correctUserString = usersFormatter.format(
            correctUsers.map((userId) => `<@${userId}>`)
          );
          const wrongUserString = usersFormatter.format(
            wrongUsers.map((userId) => `<@${userId}>`)
          );

          //create reply based on correct and wrong users
          let responseText = "";
          responseText += !correctUsers.length ? `Nobody got it right! \n` : `${correctUserString} got it right! gg *(+${pointsEarned} points)*\n`;
          responseText += !wrongUsers.length ? `That means nobody got it wrong... pretty good ig` : `That means ${wrongUserString} got it wrong, massive L *(-${pointsLost} points)*`;

          await interaction.followUp(responseText);

          //MARK: update stats

          //runs on every correct user
          for (const userId of correctUsers) {
            let userStats = await db.get(`flags_stats.flag_quiz.${userId}`);

            //default stats
            if (!userStats)
              userStats = {
                wins: 0,
                losses: 0,
                current_streak: 0,
                best_streak: 0,
                points: 0,
              };

            //simple stat manipulation
            userStats.wins++;
            userStats.current_streak++;
            userStats.points += pointsEarned;

            //set new best streak if needed
            if (userStats.current_streak > userStats.best_streak) {
              userStats.best_streak = userStats.current_streak;
            }

            //enter into db
            await db.set(`flags_stats.flag_quiz.${userId}`, userStats);
          }

          //runs on every wrong user
          for (const userId of wrongUsers) {
            let userStats = await db.get(`flags_stats.flag_quiz.${userId}`);

            //default stats
            if (!userStats)
              userStats = {
                wins: 0,
                losses: 0,
                current_streak: 0,
                best_streak: 0,
                points: 0,
              };

            //simple stat manipulation
            userStats.losses++;
            userStats.current_streak = 0;
            userStats.points -= pointsLost;

            await db.set(`flags_stats.flag_quiz.${userId}`, userStats);
          }
        });

        while (remainingTime) { //MARK: handle timer
          //sleep for less than a second because of slight timer delay
          //and it's better to stall on 0 than for the quiz to end early
          //exact value chosen by vibes based on trial and error
          await sleep(800); 

          //subtract time and update on embed
          remainingTime -= 1;
          flagEmbed.setFooter({text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`})

          await response.edit({ embeds: [flagEmbed] });
        }

        break;
      }
      case "leaderboard": { //MARK: leaderboard subcommand
        const statisticChoice = interaction.options?.getString("statistic");

        //initialize leaderboard embed
        const leaderboardEmbed = new EmbedBuilder()
          .setColor(embedColors.purple)
          .setFooter({ text: "look at all these amateurs" });

        //get game stats for every player
        const gameStats = await db.get(`flags_stats.flag_quiz`);

        //end execution if no stats found
        if (!gameStats) {
          leaderboardEmbed.setTitle("Flag Quiz");
          leaderboardEmbed.setDescription("huh, looks like there's nothing here");
          return await interaction.reply({ embeds: [leaderboardEmbed] });
        }
        
        //different stat display functions
        //note: this is an object and not a switch statement for later access
        //when selecting via message selector menu
        const statisticDisplays = {
          points: async () => { //MARK: points board
            leaderboardEmbed.setTitle("Flag Quiz - Most Points");

            //initialize variables
            let pointsLeaderboardArray = [];
            let pointsLeaderboardText = "";

            //add username to each user's stats
            for (const userId of Object.keys(gameStats)) {
              const userInfo = await client.users.fetch(userId);
              const userName = userInfo.username;

              gameStats[userId].name = userName;
              
              //push to centralized array
              pointsLeaderboardArray.push(gameStats[userId]);
            }

            //sort by most points (kinda confusing)
            pointsLeaderboardArray.sort((a, b) => {
              if (a.points > b.points) return -1;
              else if (a.points < a.points) return 1;
              else return 0;
            });

            //concat onto a single string
            for (user of pointsLeaderboardArray) {
              pointsLeaderboardText += `${user.name}: **${user.points} points**\n`;
            }

            //add to embed
            leaderboardEmbed.setDescription(pointsLeaderboardText);
          },
          "win percentage": async () => { //MARK: win % board
            leaderboardEmbed.setTitle("Flag Quiz - Highest Win Percentage");

            //initialize variables
            let percentLeaderboardArray = [];
            let percentLeaderboardText = "";

            //add username to each user's stats
            for (const userId of Object.keys(gameStats)) {
              const userInfo = await client.users.fetch(userId);
              const userName = userInfo.username;

              //some calculated stats too
              const totalGames = gameStats[userId].wins + gameStats[userId].losses
              const winPercentage = Number(gameStats[userId].wins / totalGames).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2});

              gameStats[userId].name = userName;
              gameStats[userId].win_percent = winPercentage;

              //push to centralized array
              percentLeaderboardArray.push(gameStats[userId]);
            }

            //sort by most points (kinda confusing)
            percentLeaderboardArray.sort((a, b) => {
              if (a.win_percent > b.win_percent) return -1;
              else if (a.win_percent < a.win_percent) return 1;
              else return 0;
            });

            //concatenate onto string
            for (user of percentLeaderboardArray) {
              percentLeaderboardText += `${user.name}: **${user.win_percent} of games**\n`;
            }

            //add to embed
            leaderboardEmbed.setDescription(percentLeaderboardText);
          },
          "best streak": async () => { //MARK: streak board
            leaderboardEmbed.setTitle("Flag Quiz - Longest Win Streak");

            //initialize variables
            let streakLeaderboardArray = [];
            let streakLeaderboardText = "";

            //add username to each user's stats
            for (const userId of Object.keys(gameStats)) {
              const userInfo = await client.users.fetch(userId);
              const userName = userInfo.username;

              gameStats[userId].name = userName;

              //push to centralized array
              streakLeaderboardArray.push(gameStats[userId]);
            }

            //sort by most points (kinda confusing)
            streakLeaderboardArray.sort((a, b) => {
              if (a.best_streak > b.best_streak) return -1;
              else if (a.best_streak < a.best_streak) return 1;
              else return 0;
            });

            //concatenate to string, with appropriate plurals
            for (user of streakLeaderboardArray) {
              if (user.best_streak == 1) {
                streakLeaderboardText += `${user.name}: **${user.best_streak} game**\n`;
              } else {
                streakLeaderboardText += `${user.name}: **${user.best_streak} games**\n`;
              }
            }

            //add to embed
            leaderboardEmbed.setDescription(streakLeaderboardText);
          }
        };

        //execute correct statistic display
        await statisticDisplays[statisticChoice]();
        
        //MARK: create board selector
        const boardSelector = new StringSelectMenuBuilder()
          .setCustomId("boardSelector")
          .setPlaceholder("Select leaderboard statistic...")
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

        //boilerplate for sending the message
        const selectorRow = new ActionRowBuilder().addComponents(boardSelector);

        const response = await interaction.reply({ embeds: [leaderboardEmbed], components: [selectorRow] });

        const menuCollector = response.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60000,
        });

        menuCollector.on("collect", async (i) => {
          //update for new statistic
          const newStatisticChoice = i.values[0];
          await statisticDisplays[newStatisticChoice]();

          //update message
          await response.edit({ embeds: [leaderboardEmbed] });
          await i.deferUpdate();
        });

        menuCollector.on("end", async () => {
          //disable the selector
          selectorRow.components[0].setDisabled(true);
          response.edit({ components: [selectorRow] });
        });

        break;
      }
      case "stats": { //MARK: stats subcommand
        const userChoice = interaction.options?.getUser("user") ?? interaction.member.user;

        //get stats of a specific user
        let userStats = await db.get(`flags_stats.flag_quiz.${userChoice?.id}`);

        //initialize embed
        const statsEmbed = new EmbedBuilder()
          .setColor(embedColors.purple)
          .setThumbnail(userChoice.avatarURL())
          .setFooter({ text: "look at this sweaty nerd" });

        //end execution if no stats found
        if (!userStats) {
          statsEmbed.setTitle("Flag Quiz");
          statsEmbed.setDescription("huh, looks like there's nothing here");
          return await interaction.reply({ embeds: [statsEmbed] });
        }

        //title with user name
        statsEmbed.setTitle(`Stats for ${userChoice.username}`);

        //add stats
        statsEmbed.addFields(
          {
            name: "Wins",
            value: `${userStats.wins} ${userStats.current_streak === 1 ? "win" : "wins"}\n`,
            inline: true,
          },
          {
            name: "Losses",
            value: `${userStats.losses} ${userStats.current_streak === 1 ? "loss" : "losses"}\n`,
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
            value: `${userStats.points} points\n`,
            inline: true,
          },
          {
            name: "Current Streak",
            value: `${userStats.current_streak} ${userStats.current_streak === 1 ? "game" : "games"}\n`,
            inline: true,
          },
          {
            name: "Best Streak",
            value: `${userStats.best_streak} ${userStats.best_streak === 1 ? "game" : "games"}\n`,
            inline: true,
          }
        );
        await interaction.reply({ embeds: [statsEmbed] });
        break;
      }
    }
  },
};
