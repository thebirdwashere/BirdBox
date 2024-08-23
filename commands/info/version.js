const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require("discord.js");
const { patchNotes } = require("../../utils/json/updates.json");

module.exports = { // this is messy but i literally dont care at the moment
    data: new SlashCommandBuilder()
		.setName('version')
		.setDescription('View new BirdBox patch notes or peruse past releases.')
        .addStringOption(option =>
			option
				.setName('version')
				.setDescription('Version to jump to.')
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {

        const choices = patchNotes.map(item => item.version);

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.charAt(0).toUpperCase() + focusedOption.value.slice(1).toLowerCase()
        let filtered = choices.filter(choice => choice.startsWith(value));
        filtered = filtered.map(choice => ({ name: choice, value: choice }));
        filtered = filtered.slice(0, 25);

        await interaction.respond(filtered);

    },
    // Modern Mode
    async execute(interaction, {embedColors, prefix}) {

        let version = interaction.options?.getString('version') ?? patchNotes[0].version;

        if (!patchNotes.map(item => item.version).includes(version)) return interaction.reply({ content: 'that was not a version we released lol', ephemeral: true });
        let page = patchNotes.map(item => item.version).indexOf(version);

        if(page + 1 > patchNotes.length) return interaction.reply({ content: 'bruh the pages dont even go that far back it up buddy', ephemeral: true }); // how did you even trigger this

        function updateEmbed(page) { // Returns the updated embed
            let infoEmbed;

            try {
            
                infoEmbed = new EmbedBuilder()
                    .setTitle(`${patchNotes[page].type} ${patchNotes[page].version}`)
                    .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp' })
                    .setColor(embedColors.white)
                    .addFields({ name: `Update by ${patchNotes[page].devs.join(', ')}`, value: patchNotes[page]?.contribs?.join(', ') ?? ' ' })
                    .addFields({ name: `v${patchNotes[page].version} Patch Notes`, value: `● ${patchNotes[page].notes.join('\n● ').replaceAll('e;', prefix)}` })
                    .setFooter({ text: `Release Date: ${patchNotes[page].date}` });

                
            } catch(err) { // Failsafe, something triggered this so putting a catch in to be safe

                infoEmbed = new EmbedBuilder()
                    .setTitle('ERROR')
                    .setColor(embedColors.white)
                    .setDescription('There was an error while trying to read data.' );

            }

            return [infoEmbed];
        }

        function updateRow(page) { // Returns the updated row
            const backButton = new ButtonBuilder()
                .setCustomId('backButton')
                .setLabel('🠈')
                .setStyle(ButtonStyle.Primary);
            
            const forwardButton = new ButtonBuilder()
                .setCustomId('forwardButton')
                .setLabel('🠊')
                .setStyle(ButtonStyle.Primary);
            
            const versionSelect = new StringSelectMenuBuilder()
                .setCustomId('versionSelect')
                .setPlaceholder('Select version...');

            patchNotes.forEach((item) => {
                versionSelect.addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel(item.version)
                        .setValue(patchNotes.indexOf(item).toString())
                ]);
            })

            if(page <= 0) { backButton.setDisabled(true) } else { backButton.setDisabled(false) };
            if(page >= patchNotes.length - 1) { forwardButton.setDisabled(true) } else { forwardButton.setDisabled(false) };

            const infoButtonRow = new ActionRowBuilder()
                .addComponents(backButton, forwardButton);
            
            const infoSelectRow = new ActionRowBuilder()
                .addComponents(versionSelect);

            return [infoSelectRow, infoButtonRow];
        }

        const response = await interaction.reply({ embeds: updateEmbed(page), components: updateRow(page) });

        const filter = (i) => i.user.id === interaction.user.id;

        const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000, filter });

        buttonCollector.on('collect', async (interaction) => {
            if (interaction.customId === 'backButton') {
                page -= 1; if(page < 0) page = 0; if(page + 1 > patchNotes.length) page = patchNotes.length - 1;
                await interaction.deferUpdate();
                await interaction.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
            } else if (interaction.customId === 'forwardButton') {
                page += 1; if(page < 0) page = 0; if(page + 1 > patchNotes.length) page = patchNotes.length - 1;
                await interaction.deferUpdate();
                await interaction.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
            }
        });

        const selectCollector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000, filter });

        selectCollector.on('collect', async (interaction) => {
            const page = parseInt(interaction.values[0]);
            await interaction.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
            await interaction.deferUpdate();
        });
    },
    // Classic Mode
    async executeClassic({message, args}, {prefix, embedColors}) {

        let version = args[0] ?? patchNotes[0].version;

        if (!patchNotes.map(item => item.version).includes(version)) return interaction.reply({ content: 'that was not a version we released lol', ephemeral: true });
        let page = patchNotes.map(item => item.version).indexOf(version);

        if(page + 1 > patchNotes.length) return interaction.reply({ content: 'bruh the pages dont even go that far back it up buddy', ephemeral: true }); // how did you even trigger this

        let infoEmbed;

        try {
        
            infoEmbed = new EmbedBuilder()
                .setTitle(`${patchNotes[page].type} ${patchNotes[page].version}`)
                .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp' })
                .setColor(embedColors.white)
                .addFields({ name: `Update by ${patchNotes[page].devs.join(', ')}`, value: patchNotes[page]?.contribs?.join(', ') ?? ' ' })
                .addFields({ name: `v${patchNotes[page].version} Patch Notes`, value: `● ${patchNotes[page].notes.join('\n● ').replaceAll('e;', prefix)}` })
                .setFooter({ text: `Release Date: ${patchNotes[page].date}` });

            
        } catch(err) { // Failsafe, something triggered this so putting a catch in to be safe

            infoEmbed = new EmbedBuilder()
                .setTitle('ERROR')
                .setColor(embedColors.white)
                .setDescription('There was an error while trying to read data.' );

        }

        message.reply({ embeds: [infoEmbed] });
    }
}