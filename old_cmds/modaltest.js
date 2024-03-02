const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js")

module.exports = {
    name: 'modaltest',
    description: "testing modals since these appear to exist and are cool",
    async execute({message}) {
        //create a button row
        row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('this is a button of all time')
                .setStyle(ButtonStyle.Primary)
                .setCustomId("modaltest-button")
                .setDisabled(false)
        );

        //create the message with the button (variable declared for button disabling)
        const sent = await message.reply({ content: 'click this', components: [row] }).catch(console.error);
        
        //collector for the button responses
        const buttonfilter = i => i.customId === 'modaltest-button';
        const buttoncollector = sent.createMessageComponentCollector({ buttonfilter, time: 15000 });

        buttoncollector.on('collect', async i => {

            //modal stuff
            const modal = new ModalBuilder()
                .setCustomId("modaltest-modal")
                .setTitle("Modal Test")
                .addComponents([
                    new ActionRowBuilder().addComponents(
                        //short answer input
                        new TextInputBuilder()
                            .setCustomId('input-thing')
                            .setLabel('v type something down here v')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('idk write something here')
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        //paragraph input
                        new TextInputBuilder()
                            .setCustomId('input-thing-2')
                            .setLabel('v type something down here v')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder('idk write something here')
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