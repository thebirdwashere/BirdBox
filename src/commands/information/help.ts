import { Command, CommandOption } from "@src/utility/command.js";
import { EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder, Interaction, ButtonInteraction, ComponentType, Message } from "discord.js";
import footers from "@src/data/footers.json" with { type: "json" };
import { Footers } from "@src/utility/types.js";
import { randomChoice } from "@src/utility/utility.js";

const FOOTERS = footers as Footers;

const OPTION_TYPES = [null, "subcommand", "subcommand group", "string option", "integer option", "boolean option", "user selector", "channel selector", "role selector", "user/role selector", "number option", "attachment upload"];

const Help = new Command({
  name: "help",
  description: "Browse and learn about BirdBox's many commands.",
  options: [
    new CommandOption({
      name: "command",
      description: "A specific command to view information regarding.",
      type: "string",
      optional: true,
      autocomplete: true,
    }),
  ],
  autocomplete: async (ctx) => {
    const commandsTextList = Array.from(ctx.data.registry.commands.values()).map(cmd => cmd.data.name);
    commandsTextList.sort((a, b) => { // Put commands in alphabetical order.
      if (a < b) return -1;
      else if (a > b) return 1;
      else return 0;
    });

    await ctx.respondStrings(commandsTextList);
  },
  execute: async (ctx, opts) => {
    const requestedCommand = opts.string.getOptional("command");

    const commandsList = Array.from(ctx.data.registry.commands.values());
    commandsList.sort((a, b) => { // Put commands in alphabetical order.
      if (a.data.name < b.data.name) return -1;
      else if (a.data.name > b.data.name) return 1;
      else return 0;
    });

    if (requestedCommand !== null) {

      const requestedCommandData = commandsList.find(cmd => cmd.data.name === requestedCommand)?.data;
      if (requestedCommandData == null) throw new Error("Requested command not found.");
      
      const commandTitle = requestedCommandData.name.charAt(0).toUpperCase() + requestedCommandData.name.slice(1);
      const randomFooter = randomChoice(FOOTERS.help);

      const commandEmbed = new EmbedBuilder()
        .setColor(Colors.White)
        .setTitle(commandTitle)
        .setDescription(requestedCommandData.description)
        .setThumbnail("https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.png?size=256")
        .setFooter({ text: randomFooter });
          
      if (requestedCommandData.options.length > 0) {
        for (const option of requestedCommandData.options) {
          const optionJSON = option.toJSON();
          
          const optionTitle = optionJSON.name; //optionJSON.name.charAt(0).toUpperCase() + optionJSON.name.slice(1);
          const optionType = OPTION_TYPES[optionJSON.type] ?? "subcommand";
          const optionDescription = optionJSON.description;

          let subOptions = "";
          if ("options" in optionJSON && optionJSON.options !== undefined && optionJSON.options.length > 0) {
            for (const subopt of optionJSON.options) {
              const subOptionTitle = subopt.name; //subopt.name.charAt(0).toUpperCase() + subopt.name.slice(1);
              const subOptionType = OPTION_TYPES[subopt.type] ?? "subcommand";
              const subOptionDescription = subopt.description;
              subOptions += `\n- **${subOptionTitle} (${subOptionType}):** ${subOptionDescription}`;
            }
          }

          commandEmbed.addFields({
            name: `**${optionTitle} (${optionType})**`, value: `${optionDescription}${subOptions}`
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

      //console.log(commandsList[0].data.options[0].toJSON());

      interface commandEmbedDisplay {
          name: string;
          value: string;
          inline: boolean;
      }

      const commandsArray = chunkArray<commandEmbedDisplay>(
        commandsList.map(cmd => ({
          name: `${ctx.prefix}${cmd.data.name}  ${cmd.data.options.map(opt => {
            return `\`${opt.toJSON().name}\``;
          }).join(" ")}`,
          value: cmd.data.description,
          inline: true
        })), 12
      );

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

      const backButton = new ButtonBuilder()
        .setCustomId("backButton")
        .setLabel("🠈")
        .setStyle(ButtonStyle.Primary);
        
      const forwardButton = new ButtonBuilder()
        .setCustomId("forwardButton")
        .setLabel("🠊")
        .setStyle(ButtonStyle.Primary);

      const infoButtonRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(backButton, forwardButton);

      function updateRow(page: number): [ActionRowBuilder<ButtonBuilder>] { // Returns the updated row
        if(page <= 0) backButton.setDisabled(true); else backButton.setDisabled(false);
        if(page >= embedsArray.length - 1) forwardButton.setDisabled(true); else forwardButton.setDisabled(false);

        return [infoButtonRow];
      }
  
      await ctx.reply({ embeds: updateEmbed(page), components: updateRow(page) });

      ctx.collectInteractions({
        type: ComponentType.Button,
        idleTimeLimit: 60_000,
        filter: (i: Interaction): boolean => i.user.id === ctx.user.id,
        onInteraction,
        onTimeout,
      });

      async function onInteraction(msg: Message, i: ButtonInteraction): Promise<void> {
        if (i.customId === "backButton") {
          page -= 1; if(page < 0) page = 0; if(page + 1 > embedsArray.length) page = embedsArray.length - 1;
          await i.deferUpdate();
          await msg.edit({ embeds: updateEmbed(page), components: updateRow(page) });
        } else if (i.customId === "forwardButton") {
          page += 1; if(page < 0) page = 0; if(page + 1 > embedsArray.length) page = embedsArray.length - 1;
          await i.deferUpdate();
          await msg.edit({ embeds: updateEmbed(page), components: updateRow(page) });
        }
      }

      async function onTimeout(msg: Message): Promise<void> {
        infoButtonRow.components.forEach(item => item.setDisabled(true));
        await msg.edit({ components: [infoButtonRow] });
      }
    }
  },
});

export default Help;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const splitArrays: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    splitArrays.push(arr.slice(i, i + size));
  }

  return splitArrays;
}
