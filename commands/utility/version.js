const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { patchNotes } = require("../../utils/json/updates.json");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('version')
		.setDescription('Information on BirdBox patch notes.')
        .addIntegerOption(option =>
			option
				.setName('page')
				.setDescription('Page to jump to.')
        ),
    async execute(interaction, {embedColors, prefix, pfp}) {

        let page = interaction.options?.getInteger('page') - 1; if(page < 0) page = 0;
        if(page + 1 > patchNotes.length) return interaction.reply({ content: 'bruh the pages dont even go that far back it up buddy', ephemeral: true });

        function updateEmbed(i) {

            const infoEmbed = new EmbedBuilder()
                .setTitle(`${patchNotes[i].type} ${patchNotes[i].version}`)
                .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp' })
                .setColor(embedColors.white)
                .addFields({ name: `Update by ${patchNotes[i].devs.join(', ')}`, value: patchNotes[i]?.contribs?.join(', ') ?? ' ' })
                .addFields({ name: `v${patchNotes[i].version} Patch Notes`, value: `● ${patchNotes[i].notes.join('\n● ').replaceAll('${prefix}', prefix)}` })
                .setFooter({ text: `Page ${i + 1} ● ${patchNotes[i].date}` });

            return infoEmbed;

        }

        function updateRow(i) {

            const backButton = new ButtonBuilder()
                .setCustomId('backButton')
                .setLabel('🠈')
                .setStyle(ButtonStyle.Primary);
            
            const forwardButton = new ButtonBuilder()
                .setCustomId('forwardButton')
                .setLabel('🠊')
                .setStyle(ButtonStyle.Primary);

            if(i <= 0) { backButton.setDisabled(true) } else { backButton.setDisabled(false) };
            if(i >= patchNotes.length - 1) { forwardButton.setDisabled(true) } else { forwardButton.setDisabled(false) };

            const infoRow = new ActionRowBuilder()
                .addComponents(backButton, forwardButton);

            return infoRow;

        }

        const response = await interaction.reply({ embeds: [updateEmbed(page)], components: [updateRow(page)] });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000, filter });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'backButton') {
                page -= 1;
                await interaction.deferUpdate();
                await interaction.message.edit({ embeds: [updateEmbed(page)], components: [updateRow(page)] });
            } else if (interaction.customId === 'forwardButton') {
                page += 1;
                await interaction.deferUpdate();
                await interaction.message.edit({ embeds: [updateEmbed(page)], components: [updateRow(page)] });
            }
        });


    }
}