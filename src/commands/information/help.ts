import { Command, CommandOption } from "src/utility/command.js";
import { EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder, Interaction, ButtonInteraction, ComponentType } from "discord.js";
import footers from "../../data/footers.json" with { type: "json" };
import { Footers } from "../../utility/types.js";

const FOOTERS = footers as Footers;

const Help = new Command({
    name: "help",
    description: "Browse and learn about BirdBox's many commands.",
    options: [
        new CommandOption({
            name: "command",
            description: "A specific command to view information regarding.",
            type: "string",
            required: false,
        }),
    ],
    execute: async (ctx, opts) => {
        const requestedCommand = opts.string.get("command");

        const commandsList = Array.from(ctx.data.registry.commands.values());
        commandsList.sort((a, b) => { // Put commands in alphabetical order.
	        if (a.data.name < b.data.name) return -1;
	        else if (a.data.name > b.data.name) return 1;
	        else return 0;
        });

        if (requestedCommand != null) {

            const requestedCommandData = commandsList.find(cmd => cmd.data.name === requestedCommand)?.data;
            if (requestedCommandData == null) throw new Error("Requested command not found.");
            
            const commandTitle = requestedCommandData.name.charAt(0).toUpperCase() + requestedCommandData.name.slice(1);
            const randomFooter = FOOTERS.help[Math.floor(Math.random() * FOOTERS.help.length)];

            const commandEmbed = new EmbedBuilder()
                .setColor(Colors.White)
                .setTitle(commandTitle)
                .setDescription(requestedCommandData.description)
                .setThumbnail("https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256")
                .setFooter({ text: randomFooter });
            
            if (requestedCommandData.options.length > 0) {
                for (const option of requestedCommandData.options) {
                    const optionJSON = option.toJSON();
                    
                    const optionTitle = optionJSON.name.charAt(0).toUpperCase() + optionJSON.name.slice(1);
                    const optionType = [null, "subcommand", "subcommand group", "string option", "integer option", "boolean option", "user selector", "channel selector", "role selector", "user/role selector", "number option", "attachment upload"][optionJSON.type] ?? "subcommand";
                    const optionDescription = optionJSON.description;

                    let subOptions = "";
                    if ("options" in optionJSON && optionJSON.options != null && optionJSON.options.length > 0) {
                        subOptions = ` \nSub-options: ${optionJSON.options.map(opt => `\`${opt.name}\``).join(", ")}`;
                    }

                    commandEmbed.addFields({
                        name: `${optionTitle} (${optionType})`, value: `${optionDescription}${subOptions}`
                    });
                }
            } else {
                commandEmbed.addFields({
                    name: "No command options", value: " "
                });
            }
            
            await ctx.reply({embeds: [commandEmbed]});

        } else {

            let page = 0;

            console.log(commandsList[0].data.options[0].toJSON());

            interface commandEmbedDisplay {
                name: string;
                value: string;
                inline: boolean;
            }

            const commandsArray: commandEmbedDisplay[][] = chunkArray(
                commandsList.map(cmd => ({
                    name: `${ctx.data.prefix}${cmd.data.name}  ${cmd.data.options.map(opt => {
                        return `\`${opt.toJSON().name}\``;
                    }).join(" ")}`,
                    value: cmd.data.description,
                    inline: true
                })), 12
            ) as commandEmbedDisplay[][];

            const embedsArray: EmbedBuilder[] = [];
            commandsArray.forEach(cmd => {
                const pageEmbed = new EmbedBuilder()
                    .setTitle("Commands and Info")
                    .setAuthor({ name: "BirdBox", iconURL: "https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp"})
                    .setDescription("Learn about this bot's capabilities.")
                    .setFooter({ text: `Page ${(commandsArray.indexOf(cmd) + 1).toString()}` })
                    .setColor(Colors.White);
    
                cmd.forEach(item => { pageEmbed.addFields({ name: item.name, value: item.value, inline: item.inline }); });
    
                embedsArray.push(pageEmbed);
            });
            
            function updateEmbed(page: number): [EmbedBuilder] { return [embedsArray[page]]; }
    
            function updateRow(page: number): [ActionRowBuilder<ButtonBuilder>] { // Returns the updated row
                const backButton = new ButtonBuilder()
                    .setCustomId("backButton")
                    .setLabel("🠈")
                    .setStyle(ButtonStyle.Primary);
                
                const forwardButton = new ButtonBuilder()
                    .setCustomId("forwardButton")
                    .setLabel("🠊")
                    .setStyle(ButtonStyle.Primary);
    
                if(page <= 0) backButton.setDisabled(true); else backButton.setDisabled(false);
                if(page >= embedsArray.length - 1) forwardButton.setDisabled(true); else forwardButton.setDisabled(false);
    
                const infoButtonRow = new ActionRowBuilder()
                    .addComponents(backButton, forwardButton);
    
                return [infoButtonRow as ActionRowBuilder<ButtonBuilder>];
            }
    
            await ctx.reply({ embeds: updateEmbed(page), components: updateRow(page) });
            if (ctx.lastReply == null) throw new Error("Could not locate last reply.");
    
            const filter = (i: Interaction): boolean => i.user.id === ctx.user.id;
    
            async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
                if (i.customId === "backButton") {
                    page -= 1; if(page < 0) page = 0; if(page + 1 > embedsArray.length) page = embedsArray.length - 1;
                    await i.deferUpdate();
                    await i.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
                } else if (i.customId === "forwardButton") {
                    page += 1; if(page < 0) page = 0; if(page + 1 > embedsArray.length) page = embedsArray.length - 1;
                    await i.deferUpdate();
                    await i.message.edit({ embeds: updateEmbed(page), components: updateRow(page) });
                }
            }

            const buttonCollector = ctx.lastReply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000, filter });
            buttonCollector.on("collect", (i: ButtonInteraction): void => void handleButtonInteraction(i) );

        }
    },
});

export default Help;

function chunkArray (arr: unknown[], size: number): unknown[][] {
    const splitArrays: unknown[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        splitArrays.push(arr.slice(i, i + size));
    }

    return splitArrays;
}
