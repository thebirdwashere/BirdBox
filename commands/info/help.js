const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { chunk } = require("../../utils/scripts/util_scripts.js");
const { autocomplete } = require("./version.js");
const { vars } = require("../../main.js")
const { randomFooter } = require("../../utils/scripts/util_scripts.js")

module.exports = {
    data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Browse and learn about BirdBox\'s many commands.')
        .addStringOption((option) =>
            option
                .setName('command')
                .setDescription('A specific command to get information about.')
                .setAutocomplete(true)
                
        ),
    async autocomplete(interaction) {

        const commands = vars.commands

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.toLowerCase()
        let filtered = commands.filter(command => command.data.name.toLowerCase().startsWith(value));
        filtered = filtered.map(command => ({ name: command.data.name, value: command.data.name }));
        filtered = filtered.slice(0, 25);

        await interaction.respond(filtered);

    },
    async execute(interaction, {embedColors, commands, prefix}) {

        const commandName = await interaction.options?.getString('command')

        if (commandName) {

            const command = commands.find(cmd => cmd.data.name == commandName).data
            const commandTitle = command.name.charAt(0).toUpperCase() + command.name.slice(1);

            const commandEmbed = new EmbedBuilder()
                .setColor(embedColors.white)
                .setTitle(commandTitle)
                .setDescription(command.description)
                .setThumbnail('https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256')
                .setFooter({ text: randomFooter("help") })
            
            if (command.options.length) {
                for (const option of command.options) {
                    const optionTitle = option.name.charAt(0).toUpperCase() + option.name.slice(1);
                    const optionType = [null, "subcommand", "subcommand group", "string option", "integer option", "boolean option", "user selector", "channel selector", "role selector", "user/role selector", "number option", "attachment upload"][option.type] ?? "subcommand"
                    const optionDescription = option.description
                    const subOptions = option?.options?.map(opt => opt.name)
                    const subOptionString = subOptions ? ` \nSub-options: \`${subOptions}\`` : ``

                    commandEmbed.addFields({
                        name: `${optionTitle} (${optionType})`, value: `${optionDescription}${subOptionString}`
                    })
                }
            } else {
                commandEmbed.addFields({
                    name: `No options available`, value: ` `
                })
            }
            
            await interaction.reply({embeds: [commandEmbed]})

        } else {
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
        }

        
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