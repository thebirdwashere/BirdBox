const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require("discord.js");
const { sleep } = require("../../utils/scripts/util_scripts.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Start a poll with fellow server members.')
        .addStringOption(option => option.setName('question').setDescription('Question for poll').setRequired(true))
        .addStringOption(option => option.setName('option1').setDescription('Name of first option').setMaxLength(64).setRequired(true))
        .addStringOption(option => option.setName('option2').setDescription('Name of second option').setMaxLength(64).setRequired(true))
        .addStringOption(option => option.setName('option3').setDescription('Name of third option').setMaxLength(64))
        .addStringOption(option => option.setName('option4').setDescription('Name of fourth option').setMaxLength(64))
        .addIntegerOption(option => option.setName('time').setDescription('Time (in seconds) of poll').setMinValue(5).setMaxValue(60)),
    async execute(interaction, { embedColors }) {

        let time = interaction.options?.getInteger('time') ?? 30;

        let pollName = interaction.options.getString('question');

        let options = Array.from(Array(4), (_, i) => { // Repeat 4 times.
            return { name: `option${i + 1}`, value: interaction.options.getString(`option${i + 1}`), votes: 0, voters: [] }; // Creates an object to represent each option.
        }).filter((item) => item.value !== null); // Filter out null (non-existent) values.

        function updateEmbed(sec) { // Returns the updated embed
            let pollEmbed;

            if (!sec == 0) {
                pollEmbed = new EmbedBuilder()
                    .setTitle(`Poll Question: **"${pollName.charAt(0).toUpperCase() + pollName.slice(1)}"**`)
                    .setDescription(`<@${interaction.user.id}> is starting a poll! Answer quickly, time is running out.`)
                    .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}` })
                    .setColor(embedColors.white)
                    .setFooter({ text: (sec) ? `${sec} seconds left to answer.` : `Voting has finished!` });

                options.forEach((item, i) => {
                    pollEmbed.addFields({ name: `Option ${i + 1}: *"${item.value.charAt(0).toUpperCase() + item.value.slice(1)}"*`, value: `${item.votes} votes` });
                });
            } else {
                pollEmbed = new EmbedBuilder()
                    .setTitle(`Poll Question: **"${pollName.charAt(0).toUpperCase() + pollName.slice(1)}"**`)
                    .setDescription(`<@${interaction.user.id}>'s poll ranking:`)
                    .setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}` })
                    .setColor(embedColors.green)
                    .setFooter({ text: (sec) ? `${sec} seconds left to answer.` : `Voting has finished!` });

                let optionsRanked = structuredClone(options);
                optionsRanked.sort((a, b) => b.votes - a.votes)

                optionsRanked.forEach((item, i) => {
                    pollEmbed.addFields({ name: `#${i + 1}: *"${item.value.charAt(0).toUpperCase() + item.value.slice(1)}"*`, value: `${item.votes} votes` });
                });

            }
            
            return [pollEmbed];
        }

        function updateRow(end) { // Returns the updated row
            let buttonArray = [];

            options.forEach((item) => { // Push new buttons to button array.
                buttonArray.push(
                    new ButtonBuilder()
                        .setCustomId(item.name.toString())
                        .setLabel(item.value.toString().charAt(0).toUpperCase() + item.value.toString().slice(1))
                        .setStyle((end) ? ButtonStyle.Secondary : ButtonStyle.Primary)
                        .setDisabled((end) ? true : false)
                );
            });

            let pollRow = new ActionRowBuilder().addComponents(buttonArray);

            return [pollRow];
        }

        const response = await interaction.reply({ embeds: updateEmbed(time), components: updateRow(false) });

        const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

        buttonCollector.on('collect', async (interaction) => {
            options.forEach((item) => {
                if (item.voters.includes(interaction.user.id)) item.voters.pop(interaction.user.id);
                if (item.name === interaction.customId) item.voters.push(interaction.user.id);

                item.votes = item.voters.length;
            });

            await response.edit({ embeds: updateEmbed(time), components: updateRow(false) });
            interaction.deferUpdate();
        });

        while (time) {
            await sleep(1000);

            time -= 1;
            await response.edit({ embeds: updateEmbed(time), components: updateRow((time === 0) ? true : false) });
        }
        
    }
}