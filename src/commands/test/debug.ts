import { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ModalSubmitInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuInteraction, Message, ButtonInteraction } from "discord.js";
import { Command, CommandOption, Subcommand } from "@src/utility/command.js";
import { DatabaseTableManager } from "@src/utility/database.js";

const Debug = new Command({
  name: "debug",
  description: "Debug various features of the bot.",
  permissions: ["host", "developer"],
  subcommands: [
    new Subcommand({ //MARK: debug arguments
      name: "arguments",
      description: "Debug command arguments.",
      options: [
        new CommandOption({
          name: "stringtest",
          description: "a string with min and max length",
          type: "string",
          optional: true,
          length: [10, 20],
        }),
        new CommandOption({
          name: "choicestest",
          description: "a string with choice options",
          type: "string",
          optional: true,
          choices: ["red", "green", "blue"],
        }),
        new CommandOption({
          name: "numbertest",
          description: "a number",
          type: "number",
          optional: true,
        }),
        new CommandOption({
          name: "booleantest",
          description: "a boolean",
          type: "boolean",
          optional: true,
        }),
        new CommandOption({
          name: "usertest",
          description: "a user",
          type: "user",
          optional: true,
        }),
        new CommandOption({
          name: "roletest",
          description: "a role",
          type: "role",
          optional: true,
        }),
        new CommandOption({
          name: "mentionabletest",
          description: "a mentionable",
          type: "mentionable",
          optional: true,
        }),
        new CommandOption({
          name: "channeltest",
          description: "a channel",
          type: "channel",
          optional: true,
        }),
      ],
      execute: async (ctx, opts) => {
        await ctx.send(opts.string.getOptional("stringtest")?.toString() ?? "undefined");
        await ctx.send(opts.string.getOptional("choicestest")?.toString() ?? "undefined");
        await ctx.send(opts.number.getOptional("numbertest")?.toString() ?? "undefined");
        await ctx.send(opts.boolean.getOptional("booleantest")?.toString() ?? "undefined");
        await ctx.send(opts.user.getOptional("usertest")?.username ?? "undefined");
        await ctx.send(opts.role.getOptional("roletest")?.name ?? "undefined");

        const mentionable = opts.mentionable.getOptional("mentionabletest");
        if (mentionable == null) {
          await ctx.send("undefined");
        } else if ("username" in mentionable) {
          await ctx.send(`<@${mentionable.id.toString()}>`);
        } else if ("name" in mentionable) {
          await ctx.send(`<@&${mentionable.id.toString()}>`);
        }

        const channel = opts.channel.getOptional("channeltest");
        if (channel == null) {
          await ctx.send("undefined");
        } else {
          await ctx.send(`<#${channel.id.toString()}>`);
        }
      },
    }),
    new Subcommand({ //MARK: debug database
      name: "database",
      description: "Grab values from the database at request.",
      options: [
        new CommandOption({
          name: "scope",
          description: "The scope to request values at.",
          type: "string",
          choices: ["user", "channel", "server", "global"]
        }),
        new CommandOption({
          name: "id",
          description: "The ID to grab in the database.",
          type: "string",
        }),
        new CommandOption({
          name: "property",
          description: "The property to grab in the database. If not set, will grab all the data for the provided ID.",
          type: "string",
          optional: true,
        }),
      ],
      execute: async (ctx, opts) => {
        const scope = opts.string.getRequired("scope");
        const id = opts.string.getRequired("id");
        const property = opts.string.getOptional("property");

        let databaseTable: DatabaseTableManager;

        switch (scope) {
          case "user": {
            databaseTable = ctx.db.user;
            break;
          } case "channel": {
            databaseTable = ctx.db.channel;
            break;
          } case "server": {
            databaseTable = ctx.db.server;
            break;
          } case "global": {
            databaseTable = ctx.db.global;
            break;
          } default: {
            throw new Error("Scope not among required values.");
          }
        }

        let returnValue: string;
        if (property !== null) {
          const databaseReturn = databaseTable.fetchOrUndefined(id, property);

          if (databaseReturn == null) {
            throw new Error(`Requested property "${property}" does not exist for that ID.`);
          }

          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          const returnString = String(databaseReturn);
          if (returnString === "[object Object]") {
            returnValue = JSON.stringify(databaseReturn, undefined, 2);
          } else {
            returnValue = returnString;
          }

        } else {
          returnValue = JSON.stringify(databaseTable.fetchFull(id), undefined, 2);
        }

        if (returnValue.length <= 1500) {
          await ctx.reply(`Database fetch for ID ${id} returned the following value(s): \`\`\`json\n${returnValue}\n\`\`\``);
        } else {
          //https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript
          const returnValueSplit = returnValue.match(/(.|[\r\n]){1,1500}/g);
          if (returnValueSplit == null || returnValueSplit.length === 0)
            throw new Error("Error splitting value for character limits.");

          await ctx.reply(`Database fetch for ID ${id} returned the following value(s):`);
          for (const text of returnValueSplit) {
            await ctx.send(`\`\`\`json\n${text}\n\`\`\``);
          }
        }
      },
    }),
    new Subcommand({
      name: "error",
      description: "This command always throws an error.",
      // eslint-disable-next-line @typescript-eslint/require-await
      execute: async (_) => {
        throw new Error("Error message.");
      }
    }),
    new Subcommand({ //MARK: debug permissions
      name: "permissions",
      description: "Only the bot host (TheBirdWasHere) should be able to run this command!",
      permissions: ["host"],
      execute: async (ctx) => {
        await ctx.reply("Hello Bird!");
      }
    }),
    new Subcommand({ //MARK: debug cooldown
      name: "cooldown",
      description: "Ensure a cooldown of 5 minutes works as expected.",
      cooldown: 300_000,
      execute: async (ctx) => {
        await ctx.reply("Cooldown is not active!");
      }
    }),
    new Subcommand({ //MARK: debug actionrow
      name: "actionrow",
      description: "Test the system that handles buttons and select menus.",
      execute: async (ctx) => {
        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("debug-actionrow-select")
              .setOptions([
                new StringSelectMenuOptionBuilder()
                  .setLabel("option 1")
                  .setDescription("the first option")
                  .setValue("1"),
                new StringSelectMenuOptionBuilder()
                  .setLabel("option 2")
                  .setDescription("the second option")
                  .setValue("2"),
                new StringSelectMenuOptionBuilder()
                  .setLabel("option 3")
                  .setDescription("the third option")
                  .setValue("3")
              ])
          );

        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setLabel("Red")
              .setStyle(ButtonStyle.Danger)
              .setCustomId("debug-actionrow-red"),
            new ButtonBuilder()
              .setLabel("Green")
              .setStyle(ButtonStyle.Success)
              .setCustomId("debug-actionrow-green"),
            new ButtonBuilder()
              .setLabel("Blue")
              .setStyle(ButtonStyle.Primary)
              .setCustomId("debug-actionrow-blue")
          );

        await ctx.reply({ components: [selectMenuRow, buttonRow] });

        ctx.collectInteractions({
          type: ComponentType.StringSelect,
          filter: (i: StringSelectMenuInteraction) => i.user.id === ctx.user.id,
          idleTimeLimit: 60_000,
          onInteraction: onSelectInteraction,
          onTimeout: onSelectTimeout
        });

        async function onSelectInteraction(_: Message, i: StringSelectMenuInteraction): Promise<void> {
          await i.deferUpdate();
          const responseVal = i.values[0];
          await ctx.send(`You selected option ${responseVal}!`);
        }

        async function onSelectTimeout(msg: Message): Promise<void> {
          //deactivate buttons
          selectMenuRow.components.forEach(item => item.setDisabled(true));
          await msg.edit({ components: [selectMenuRow, buttonRow] });
        }

        ctx.collectInteractions({
          type: ComponentType.Button,
          filter: (i: ButtonInteraction) => i.user.id === ctx.user.id,
          idleTimeLimit: 60_000,
          onInteraction: onButtonInteraction,
          onTimeout: onButtonTimeout
        });

        async function onButtonInteraction(_: Message, i: ButtonInteraction): Promise<void> {
          await i.deferUpdate();
          const responseVal = /debug-actionrow-(.+)/.exec(i.customId)?.at(1);
          if (responseVal === undefined)
            throw new Error("Could not locate color in button ID.");

          await ctx.send(`You selected the ${responseVal} button!`);
        }

        async function onButtonTimeout(msg: Message): Promise<void> {
          //deactivate buttons
          buttonRow.components.forEach(item => item.setDisabled(true));
          await msg.edit({ components: [selectMenuRow, buttonRow] });
        }
      }
    }),
    new Subcommand({ //MARK: debug modal
      name: "modal",
      description: "Test the modal system.",
      execute: async (ctx) => {
        const editModal = new ModalBuilder()
          .setCustomId("debug-testing")
          .setTitle("Testing Modal")
          .addComponents([
            new ActionRowBuilder<TextInputBuilder>()
              .addComponents(
                new TextInputBuilder()
                  .setCustomId("debug-text")
                  .setLabel("Response")
                  .setStyle(TextInputStyle.Short)
                  .setPlaceholder("It's love. But only if it's eternal love...")
                  .setRequired(true)
              ),
          ]);

        await ctx.replyModal(editModal, onModalSubmit);

        async function onModalSubmit(i: ModalSubmitInteraction): Promise<void> {
          const submission = i.fields.getTextInputValue("debug-text");
          await i.reply(`You submitted: \n\`\`\`\n${submission}\n\`\`\``);
        }
      }
    }),
  ],
});

export default Debug;
