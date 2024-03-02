const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js")

module.exports = {
    name: 'translatemodaltest',
    description: "testing modals since these appear to exist and are cool",
    async execute({message}) {
        //create a button row
        row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Translate')
                .setStyle(ButtonStyle.Primary)
                .setCustomId("modaltest-button")
                .setDisabled(false)
        );

        //create the message with the button (variable declared for button disabling)
        const sent = await message.reply({ content: 'Click to open translate dialog...', components: [row] }).catch(console.error);
        
        //collector for the button responses
        const buttonfilter = i => i.customId === 'modaltest-button';
        const buttoncollector = sent.createMessageComponentCollector({ buttonfilter, time: 15000 });

        buttoncollector.on('collect', async i => {

            //modal stuff
            const modal = new ModalBuilder()
                .setCustomId("translate-modal")
                .setTitle("Translate")
                .addComponents([
                    new ActionRowBuilder().addComponents(
                        //short answer input
                        new TextInputBuilder()
                            .setCustomId('translate-input')
                            .setLabel('Type the text you want to be translated')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('Input text...')
                            .setRequired(true)
                    )
            ]);
            
            //show the popup
            await i.showModal(modal).catch(console.error);

            //disable the button
            row.components[0].setDisabled(true)
            await i.editReply({ components: [row] })
        });

        buttoncollector.on('end', collected => {
            //disable the button
            row.components[0].setDisabled(true)
            sent.edit({ components: [row] })
        });
    }
}