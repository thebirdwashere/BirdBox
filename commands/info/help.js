const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { chunk } = require("../../utils/scripts/util_scripts.js");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Returns a list of commands with command descriptions.'),
    async execute(interaction, {embedColors, commands, prefix}) {

        let page = 0;

        commandsArray = chunk(
            commands.map(item => ({
                name: `${prefix}${item.data.name}  ${item.data.options.map(item => `\`${item.name}\``)?.join(' ')}`,
                value: item.data.description,
                inline: true
            })), 12
        );

        let embeds = [];
        commandsArray.forEach((item) => {
            const pageEmbed = new EmbedBuilder()
                .setTitle('Commands and Info')
                .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
                .setDescription(`Learn about this bots capabilities.`)
                .setFooter({ text: `Page ${commandsArray.indexOf(item) + 1}` })
                .setColor(embedColors.white);

            item.forEach((item) => { pageEmbed.addFields({ name: item.name, value: item.value, inline: item.inline }); });

            embeds.push(pageEmbed);
        });

        function updateEmbed(page) { return [embeds[page]] }

        function updateRow(page) { // Returns the updated row
            const backButton = new ButtonBuilder()
                .setCustomId('backButton')
                .setLabel('🠈')
                .setStyle(ButtonStyle.Primary);
            
            const forwardButton = new ButtonBuilder()
                .setCustomId('forwardButton')
                .setLabel('🠊')
                .setStyle(ButtonStyle.Primary);

            if(page <= 0) { backButton.setDisabled(true) } else { backButton.setDisabled(false) }
            if(page >= embeds.length - 1) { forwardButton.setDisabled(true) } else { forwardButton.setDisabled(false) }

            const infoButtonRow = new ActionRowBuilder()
                .addComponents(backButton, forwardButton);

            return [infoButtonRow];
        }

        const response = await interaction.reply({ embeds: updateEmbed(page), components: updateRow(page) });

        const filter = (i) => i.user.id === interaction.user.id;

        const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000, filter });

        buttonCollector.on('collect', async (interaction) => {
            if (interaction.customId === 'backButton') {
                page -= 1; if(page < 0) page = 0; if(page + 1 > embeds.length) page = embeds.length - 1;
                await interaction.deferUpdate();
                await interaction.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
            } else if (interaction.customId === 'forwardButton') {
                page += 1; if(page < 0) page = 0; if(page + 1 > embeds.length) page = embeds.length - 1;
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
    async executeClassic({message}, {embedColors, commands, prefix}) {

        commandsArray = chunk(
            commands.map(item => ({
                name: `${prefix}${item.data.name}  ${item.data.options.map(item => `\`${item.name}\``)?.join(' ')}`,
                value: item.data.description,
                inline: true
            })), 24
        );

        let embeds = [];
        commandsArray.forEach((item) => {
            const pageEmbed = new EmbedBuilder()
                .setColor(embedColors.white);

            item.forEach((item) => { pageEmbed.addFields({ name: item.name, value: item.value, inline: item.inline }); });

            embeds.push(pageEmbed);
        });

        embeds[0]
            .setTitle('Commands and Info')
            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
            .setDescription(`Learn about this bots capabilities.`);

        await message.reply({ embeds: embeds });
        
    }
}