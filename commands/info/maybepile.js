const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");

module.exports = { //MARK: command data
    data: new SlashCommandBuilder()
		.setName('maybepile')
		.setDescription('A list of possible features.')
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("Simply take a look at the existing items.")
                .addStringOption((option) =>
                    option
                        .setName("page")
                        .setDescription("The item to be displayed. Defaults to the Table of Contents if blank.")
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("suggest")
                .setDescription("Create an item of your own!")
                .addStringOption((option) =>
                    option
                        .setName("title")
                        .setDescription("Should be a short summary or pitch of the idea.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("description")
                        .setDescription("A longer and clearer version. Helpful for developers to correctly interpret your idea.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("suggester")
                        .setDescription("Important to include if it's not you.")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("edit")
                .setDescription("Edit an item. Must be a dev!")
                .addStringOption((option) =>
                    option
                        .setName("item")
                        .setDescription("The item to be edited.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete")
                .setDescription("Delete an item. Must be a dev!")
                .addStringOption((option) =>
                    option
                        .setName("item")
                        .setDescription("The item to be deleted.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("claim")
                .setDescription("Declare if you plan to contribute an item!")
                .addStringOption((option) =>
                    option
                        .setName("item")
                        .setDescription("The item to be claimed.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("status")
                        .setDescription("The status of the claimed item.")
                        .addChoices(
                            { name: 'claimed', value: 'claimed' },
                            { name: 'in development', value: 'indev' },
                            { name: 'deprioritized', value: 'deprior' },
                            { name: 'unclaimed', value: 'unclaimed' }
                        )
                )
        ),
    cooldown: 5000,
    async autocomplete(interaction, {db}) { //MARK: autocomplete

        const maybeArray = await db.get('maybepile') ?? ["Table of Contents"]
        const choices = maybeArray.map(item => `${maybeArray.indexOf(item)}: ${item.title ?? item}`)

        if (interaction.options.getSubcommand() !== "view") choices.shift()

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.charAt(0).toLowerCase() + focusedOption.value.slice(1)
        let filtered = choices.filter(choice => choice.startsWith(value));
        filtered = filtered.map(choice => ({ name: choice, value: choice }));
        filtered = filtered.slice(0, 25);

        await interaction.respond(filtered);

    },
    async execute(interaction, {db, admins, embedColors}) {

        let maybeArray = await db.get('maybepile') 
        const defaultArray = ["Table of Contents"]

        if (!maybeArray) {
            await db.set('maybepile', defaultArray); //default array if nothing is present
            maybeArray = defaultArray
        }

        console.table(maybeArray)

        switch (interaction.options.getSubcommand()) { // Switch to handle different subcommands.
            case 'view': { //MARK: view subcommand
                let pageNum = interaction.options?.getString('page')[0] ?? 0
                console.log(pageNum)

                if (pageNum == 0) { //table of contents

                    const tableOfContentsEmbed = new EmbedBuilder()
                        .setColor(embedColors.purple)
                        .setTitle("The Maybe Pile")
                        .setDescription('Take a look at and suggest potential features!')
                        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
                        .setFooter({text: 'Page 0 ● Also a bot that doesn\'t run on spaghetti code.'})
                    
                    for (const maybepileItem of maybeArray.slice(1, 24)) {
                        tableOfContentsEmbed.addFields({name: maybepileItem.title, value: `Suggested by ${maybepileItem.suggester} (*${maybepileItem.claim?.text ?? `unclaimed`}*)`, inline: true})
                    }

                    if (maybeArray[25]) {
                        tableOfContentsEmbed.addFields({name: `...and ${maybeArray.length - 24} more`, value: `See their individual pages!`, inline: true})
                    }

                    await interaction.reply({embeds: [tableOfContentsEmbed]});

                } else { //specific item

                    let chosenItem = maybeArray[pageNum]

                    function generateItemEmbed(item) {
                        const suggestedStatus = `Suggested by ${item.suggester}`
                        let claimStatus = "Claimed by WILL ADD LATER"
    
                        if (item.claim?.text == "claimed") {
                            claimStatus = `Claimed by ${item.claim?.claimer}`
                        } else if (item.claim?.text == "in development") {
                            claimStatus = `In development by ${item.claim?.claimer}`
                        } else if (item.claim?.text == "deprioritized") {
                            claimStatus = `Deprioritized`
                        } else {
                            claimStatus = `Unclaimed`
                        }
    
                        const itemEmbed = new EmbedBuilder()
                            .setColor(embedColors.purple)
                            .setTitle("The Maybe Pile")
                            .setDescription('Take a look at and suggest potential features!')
                            .addFields({name: item.title, value: item.description})
                            .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
                            .setFooter({text: `Page ${pageNum} ● ${suggestedStatus} ● ${claimStatus}`})
                        
                        return itemEmbed
                    }

                    const leftButton = new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("maybepile-left")
                        .setLabel("🡨")
                    const rightButton = new ButtonBuilder()
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("maybepile-right")
                        .setLabel("🡪")
                    const buttonRow = new ActionRowBuilder()
                        .addComponents(leftButton, rightButton)
                    
                    if (pageNum == 1) {
                        buttonRow.components[0].setDisabled(true)
                    }

                    console.log("yep its running")
                    
                    const response = await interaction.reply({embeds: [generateItemEmbed(chosenItem)], components: [buttonRow]});

                    const buttonCollector = response.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 15000,
                    });
                    
                    buttonCollector.on("collect", async (i) => {
                        const customId = i.customId
                        if (customId == "maybepile-left") {
                            pageNum--
                        } else if (customId == "maybepile-right") {
                            pageNum++
                        } else { //huh what
                            await response.edit({content: "what did you just press. how did this happen."})
                        }

                        chosenItem = maybeArray[pageNum]

                            if (pageNum == 1) {
                                buttonRow.components[0].setDisabled(true)
                            } else {
                                buttonRow.components[0].setDisabled(false)
                            }

                            if (pageNum == maybeArray.length - 1) {
                                buttonRow.components[1].setDisabled(true)
                            } else {
                                buttonRow.components[1].setDisabled(false)
                            }

                            await response.edit({embeds: [generateItemEmbed(chosenItem)], components: [buttonRow]})

                        await i.deferUpdate()
                    })

                    buttonCollector.on("end", async () => {
                        //disable the buttons
                        buttonRow.components.forEach(item => item.setDisabled(true))
                        await response.edit({ components: [buttonRow] })
                    });
                }

                break;
            }
            case 'suggest': { //MARK: suggest subcommand
                const title = interaction.options?.getString('title')
                const description = interaction.options?.getString('description')
                const suggester = interaction.options?.getString('suggester') ?? interaction.user.username
                const claim = {text: "unclaimed"}

                maybeArray[maybeArray.length] = {title, description, suggester, claim}
                await interaction.reply({content: `**${maybeArray[maybeArray.length - 1].title}** has been added to the maybepile!`});

                break;
            }
            case 'edit': { //MARK: edit subcommand
                const userIsAdmin = admins.map(user => user.userId).includes(interaction.user.id)
                    
                if (userIsAdmin) {
                    const itemNum = interaction.options?.getString('item')[0]
                    const originalItem = maybeArray[itemNum]

                    const modalFields = [
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('maybepile-title')
                                    .setLabel(`Title`)
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder(`Title of the item.`)
                                    .setValue(originalItem.title)
                                    .setRequired(true)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('maybepile-description')
                                    .setLabel('Description')
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setPlaceholder(`The description of the item, displayed on the item's page.`)
                                    .setValue(originalItem.description)
                                    .setRequired(true)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('maybepile-suggester')
                                    .setLabel(`Suggester`)
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder(`Person who suggested this item to be added. Credit where it's due!`)
                                    .setValue(originalItem.suggester)
                                    .setRequired(true)
                            )
                    ]
                        
                    const editModal = new ModalBuilder()
                        .setCustomId("maybepile-edit")
                        .setTitle("Edit Maybepile Item")
                        .addComponents(modalFields)
                    
                    await interaction.showModal(editModal).catch(err => console.error(err));
                    
                    const editFilter = interaction => interaction.customId === 'maybepile-edit';
                    await interaction.awaitModalSubmit({ filter: editFilter, time: 15_000 })
                        .then(
                            async i => {
                                let newItem = {};
                                newItem.title = i.fields.getTextInputValue('maybepile-title')
                                newItem.description = i.fields.getTextInputValue('maybepile-description')
                                newItem.suggester = i.fields.getTextInputValue('maybepile-suggester')

                                maybeArray[itemNum] = newItem
                                await i.reply({content: `**${maybeArray[itemNum].title}** has been edited successfully!`});
                            }
                        )
                } else {
                    await interaction.reply({content: `bruh, only devs can edit stuff`, ephemeral: true});
                }

                break;
            }
            case 'delete': { //MARK: delete subcommand
                const itemNum = interaction.options?.getString('item')[0]

                const userIsAdmin = admins.map(user => user.userId).includes(interaction.user.id)
                    
                if (userIsAdmin) {
                    const removedItem = maybeArray.splice(itemNum, 1)[0]
                    await interaction.reply({content: `**${removedItem.title}** has been deleted from the maybepile!`});
                } else {
                    await interaction.reply({content: `bruh, only devs can delete stuff`, ephemeral: true});
                }

                break;
            }
            case 'claim': { //MARK: claim subcommand
                const itemNum = interaction.options?.getString('item')[0]
                const claimStatus = interaction.options?.getString('status') ?? "claimed"

                const alreadyClaimed = maybeArray[itemNum]?.claim?.id
                const claimerNotCommandUser = interaction.user.id != maybeArray[itemNum]?.claim?.id

                if (alreadyClaimed && claimerNotCommandUser) {
                    return await interaction.reply({content: `sorry, that's already been claimed`})
                }

                if (!maybeArray[itemNum].claim) maybeArray[itemNum].claim = {text: "Unclaimed"}

                if (claimStatus == "claimed") {
                    maybeArray[itemNum].claim.text = `claimed`
                    maybeArray[itemNum].claim.claimer = interaction.user.username
                    maybeArray[itemNum].claim.id = interaction.user.id
                    await interaction.reply({content: `${interaction.user.username} has claimed **${maybeArray[itemNum].title}**!`})
                } else if (claimStatus == "indev") {
                    maybeArray[itemNum].claim.text = `in development`
                    maybeArray[itemNum].claim.claimer = interaction.user.username
                    maybeArray[itemNum].claim.id = interaction.user.id
                    await interaction.reply({content: `${interaction.user.username} has started work on **${maybeArray[itemNum].title}**!`})
                } else if (claimStatus == "deprior") {
                    maybeArray[itemNum].claim.text = `deprioritized`
                    maybeArray[itemNum].claim.claimer = null
                    maybeArray[itemNum].claim.id = null
                    await interaction.reply({content: `${interaction.user.username} has deprioritized **${maybeArray[itemNum].title}**!`})
                } else if (claimStatus == "unclaimed") {
                    maybeArray[itemNum].claim.text = `unclaimed`
                    maybeArray[itemNum].claim.claimer = null
                    maybeArray[itemNum].claim.id = null
                    await interaction.reply({content: `${interaction.user.username} has unclaimed **${maybeArray[itemNum].title}**!`})
                }

                break;
            }
        }

        await db.set('maybepile', maybeArray) 
        console.table(maybeArray)

    }
}