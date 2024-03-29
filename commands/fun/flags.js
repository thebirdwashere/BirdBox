const { sampleArray, shuffleArray, sleep } = require("../../utils/scripts/util_scripts.js");
const flags = require("../../utils/json/flags.json");
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('flags')
		.setDescription('Guess some stuff about flags.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('quiz')
                .setDescription('Given a country, guess its flag.')
        ),
    async execute(interaction, {embedColors}) {

        const countryNames = Object.keys(flags)
        const countryFlags = Object.values(flags)

        const guessFlags = sampleArray(countryFlags, 4)
        const rightFlag = guessFlags[0]
        const rightCountry = countryNames[countryFlags.indexOf(rightFlag)]
        
        const shuffledFlags = shuffleArray(guessFlags)

        let remainingTime = 15

        const flagEmbed = new EmbedBuilder()
        .setTitle(`What is the flag of ${rightCountry}?`)
        .setFooter({text: `${remainingTime} seconds left to answer get going ppl`})
        .setColor(embedColors.blue)

        const flagButton1 = new ButtonBuilder()
        .setCustomId(shuffledFlags[0])
        .setEmoji(shuffledFlags[0])
        .setStyle(ButtonStyle.Primary);

        const flagButton2 = new ButtonBuilder()
        .setCustomId(shuffledFlags[1])
        .setEmoji(shuffledFlags[1])
        .setStyle(ButtonStyle.Primary);

        const flagButton3 = new ButtonBuilder()
        .setCustomId(shuffledFlags[2])
        .setEmoji(shuffledFlags[2])
        .setStyle(ButtonStyle.Primary);

        const flagButton4 = new ButtonBuilder()
        .setCustomId(shuffledFlags[3])
        .setEmoji(shuffledFlags[3])
        .setStyle(ButtonStyle.Primary);

        const buttonRow = new ActionRowBuilder()
            .addComponents(flagButton1, flagButton2, flagButton3, flagButton4)

        const response = await interaction.reply({embeds: [flagEmbed], components: [buttonRow]})

        const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

        let correctUsers = []
        let wrongUsers = []

        buttonCollector.on('collect', async i => {
            const userPing = `<@${i.member.id}>`
            if (i.customId == rightFlag && !correctUsers.includes(userPing)) {
                if (wrongUsers.includes(userPing)) {
                    wrongUsers.splice(wrongUsers.indexOf(userPing), 1)
                }
                
                correctUsers.push(userPing)
            }

            if (i.customId != rightFlag && !wrongUsers.includes(userPing)) {
                if (correctUsers.includes(userPing)) {
                    correctUsers.splice(correctUsers.indexOf(userPing), 1)
                }
                wrongUsers.push(userPing)
            }

            const peopleGuessed = correctUsers.length + wrongUsers.length
            flagEmbed.setDescription(`${peopleGuessed} guessed`)
            
            await response.edit({embeds: [flagEmbed]})
            i.deferUpdate()
        });

        buttonCollector.on('end', async () => {

            buttonRow.components.forEach(async button => {
                await button
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            })

            const rightFlagIndex = shuffledFlags.indexOf(rightFlag)
            await buttonRow.components[rightFlagIndex].setStyle(ButtonStyle.Success)

            await response.edit({embeds: [flagEmbed], components: [buttonRow]})

            const usersFormatter = new Intl.ListFormat("en", { type: "conjunction" })
            const correctUserString = usersFormatter.format(correctUsers)
            const wrongUserString = usersFormatter.format(wrongUsers)

            switch (correctUsers.length) {
                case 0:
                    await interaction.followUp(`Nobody got it right!`)
                    break;
                case 1:
                    await interaction.followUp(`${correctUserString} got it right! gg`)
                    break;
                case 2:
                    await interaction.followUp(`${correctUserString} both got it right! gg`)
                    break;
                default:
                    await interaction.followUp(`${correctUserString} all got it right! gg`)
                    break;
            }
            switch (wrongUsers.length) {
                case 0:
                    await interaction.channel.send(`That means nobody got it wrong... pretty good ig`)
                    break;
                case 1:
                    await interaction.channel.send(`That means ${wrongUserString} got it wrong, massive L`)
                    break;
                case 2:
                    await interaction.channel.send(`That means ${wrongUserString} both got it wrong, massive L`)
                    break;
                default:
                    await interaction.channel.send(`That means ${wrongUserString} all got it wrong, massive L`)
                    break;
            }
        });

        while (remainingTime) {
            await sleep(5000)

            remainingTime -= 5
            flagEmbed.setFooter({text: `${remainingTime} seconds left to answer get going ppl`})

            await response.edit({embeds: [flagEmbed]})
        }
    }
}