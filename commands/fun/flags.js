const { sampleArray, shuffleArray, sleep } = require("../../utils/scripts/util_scripts.js");
const { flags, difficulties } = require("../../utils/json/flags.json");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('flags')
		.setDescription('Guess some stuff about flags.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('quiz')
                .setDescription('Given a country, guess its flag.')
                .addStringOption(option =>
                    option
                        .setName('difficulty')
                        .setDescription('Change how many flags are available to guess.')
                        .addChoices(
                            { name: `${difficulties[0].name} (${difficulties[0].points} points)`, value: "0" },
                            { name: `${difficulties[1].name} (${difficulties[1].points} points)`, value: "1" },
                            { name: `${difficulties[2].name} (${difficulties[2].points} points)`, value: "2" },
                            { name: `${difficulties[3].name} (${difficulties[3].points} points)`, value: "3" },
                            { name: `${difficulties[4].name} (${difficulties[4].points} points)`, value: "4" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View high scores across all BirdBox users.')
        ),
    async execute(interaction, {client, embedColors, db}) {

        switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
            case 'quiz': {
                const difficulty = difficulties[interaction.options?.getString('difficulty')] ?? difficulties[0]
                const flagsNum = difficulty.flags;

                const countryNames = Object.keys(flags);
                const countryFlags = Object.values(flags);
        
                const guessFlags = sampleArray(countryFlags, flagsNum);
                const rightFlag = guessFlags[0];
                const rightCountry = countryNames[countryFlags.indexOf(rightFlag)];
                
                const shuffledFlags = shuffleArray(guessFlags);
        
                let remainingTime = 15;
                let peopleGuessed = 0;
        
                const flagEmbed = new EmbedBuilder()
                .setTitle(`What is the flag of ${rightCountry}?`)
                flagEmbed.setFooter({text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`})
                .setColor(embedColors.blue);
        
                let buttonRowArray = []

                for (let i = 0; i < flagsNum; i++) {
                    const buttonRowNum = Math.floor(i/4)

                    if (!buttonRowArray[buttonRowNum]) {
                        buttonRowArray[buttonRowNum] = new ActionRowBuilder()
                    }
                    
                    buttonRowArray[buttonRowNum].addComponents(
                        new ButtonBuilder()
                        .setCustomId(shuffledFlags[i])
                        .setEmoji(shuffledFlags[i])
                        .setStyle(ButtonStyle.Primary)
                    )
                }
        
                const response = await interaction.reply({embeds: [flagEmbed], components: buttonRowArray})
        
                const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });
        
                let correctUsers = []
                let wrongUsers = [interaction.member.id] //automatically a loser, just in case you don't answer
        
                buttonCollector.on('collect', async i => {
                    const userId = i.member.id
                    if (i.customId == rightFlag && !correctUsers.includes(userId)) {
                        if (wrongUsers.includes(userId)) {
                            wrongUsers.splice(wrongUsers.indexOf(userId), 1)
                        }
                        
                        correctUsers.push(userId)
                    }
        
                    if (i.customId != rightFlag && !wrongUsers.includes(userId)) {
                        if (correctUsers.includes(userId)) {
                            correctUsers.splice(correctUsers.indexOf(userId), 1)
                        }
                        wrongUsers.push(userId)
                    }
        
                    peopleGuessed = correctUsers.length + wrongUsers.length
                    flagEmbed.setFooter({text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`})
                    
                    await response.edit({embeds: [flagEmbed]})
                    i.deferUpdate()
                });
        
                buttonCollector.on('end', async () => {
        
                    buttonRowArray.forEach(row => {
                        row.components.forEach(async button => {
                            await button
                                .setStyle(ButtonStyle.Danger)
                                .setDisabled(true)
                        })
                    })
        
                    const rightFlagIndex = shuffledFlags.indexOf(rightFlag)
                    await buttonRowArray[Math.floor(rightFlagIndex / 4)].components[rightFlagIndex % 4].setStyle(ButtonStyle.Success)
        
                    await response.edit({embeds: [flagEmbed], components: buttonRowArray})
                    
                    const pointsEarned = difficulty.earned
                    const pointsLost = difficulty.lost
        
                    const usersFormatter = new Intl.ListFormat("en", { type: "conjunction" })
                    const correctUserString = usersFormatter.format(correctUsers.map(userId => `<@${userId}>`))
                    const wrongUserString = usersFormatter.format(wrongUsers.map(userId => `<@${userId}>`))
        
                    let responseText = ""
        
                    switch (correctUsers.length) {
                        case 0:
                            responseText += `Nobody got it right! \n`
                            break;
                        case 1:
                            responseText += `${correctUserString} got it right! gg *(+${pointsEarned} points)*\n`
                            break;
                        case 2:
                            responseText += `${correctUserString} both got it right! gg *(+${pointsEarned} points)*\n`
                            break;
                        default:
                            responseText += `${correctUserString} all got it right! gg *(+${pointsEarned} points)*\n`
                            break;
                    }
                    switch (wrongUsers.length) {
                        case 0:
                            responseText += `That means nobody got it wrong... pretty good ig`
                            break;
                        case 1:
                            responseText += `That means ${wrongUserString} got it wrong, massive L *(-${pointsLost} points)*`
                            break;
                        case 2:
                            responseText += `That means ${wrongUserString} both got it wrong, massive L *(-${pointsLost} points)*`
                            break;
                        default:
                            responseText += `That means ${wrongUserString} all got it wrong, massive L *(-${pointsLost} points)*`
                            break;
                    }
                    
                    await interaction.followUp(responseText)
        
                    for (const userId of correctUsers) {
                        let userStats = await db.get(`flags_stats.flag_quiz.${userId}`);
        
                        if (!userStats) userStats = {
                                wins: 0,
                                losses: 0,
                                current_streak: 0,
                                best_streak: 0,
                                points: 0
                        }
        
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
        
                        if (!userStats) userStats = {
                            wins: 0,
                            losses: 0,
                            current_streak: 0,
                            best_streak: 0,
                            points: 0
                        }
                        
                        userStats.losses++;
                        userStats.current_streak = 0;
                        userStats.points -= pointsLost;
        
                        await db.set(`flags_stats.flag_quiz.${userId}`, userStats);
                    }
                    
                });
        
                while (remainingTime) {
                    await sleep(5000)
        
                    remainingTime -= 5
                    flagEmbed.setFooter({text: `${peopleGuessed} guessed ● ${remainingTime} seconds left`})
        
                    await response.edit({embeds: [flagEmbed]})
                }

                break;
            }
            case "leaderboard": {
                const leaderboardEmbed = new EmbedBuilder()
                .setColor(embedColors.purple)
                .setTitle("Flag Quiz - Most Points")

                const gameStats = await db.get(`flags_stats.flag_quiz`)

                if (!gameStats) {
                    leaderboardEmbed.setDescription("huh, looks like there's nothing here");
                    await interaction.reply({ embeds: [leaderboardEmbed] });
                    return;
                }

                let pointsLeaderboardArray = [];
                let pointsLeaderboardText = "";

                for (const userId of Object.keys(gameStats)) {
                    const userInfo = await client.users.fetch(userId)
                    const userName = userInfo.username

                    gameStats[userId].name = userName
                    pointsLeaderboardArray.push(gameStats[userId])
                }

                //sort by most points (kinda confusing)
                pointsLeaderboardArray.sort((a, b) => {
                    if (a.points > b.points) return -1
                    else if (a.points < a.points) return 1
                    else return 0 
                });

                for (user of pointsLeaderboardArray) {
                    pointsLeaderboardText += `${user.name}: **${user.points} points**\n`
                }

                leaderboardEmbed.setDescription(pointsLeaderboardText);
    
                await interaction.reply({ embeds: [leaderboardEmbed] });
            }
        }
    }
}