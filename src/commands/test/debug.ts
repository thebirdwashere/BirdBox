import { ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ModalSubmitInteraction } from "discord.js";
import { Command, CommandOption, Subcommand } from "src/utility/command.js";
import { DatabaseTableManager } from "src/utility/database.js";

const Debug = new Command({
  name: "debug",
  description: "Debug various features of the bot.",
  permissions: ["host", "developer"],
  subcommands: [
    new Subcommand({
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
        await ctx.send(opts.string.get("stringtest")?.toString() ?? "undefined");
        await ctx.send(opts.string.get("choicestest")?.toString() ?? "undefined");
        await ctx.send(opts.number.get("numbertest")?.toString() ?? "undefined");
        await ctx.send(opts.boolean.get("booleantest")?.toString() ?? "undefined");
        await ctx.send(opts.user.get("usertest")?.username ?? "undefined");
        await ctx.send(opts.role.get("roletest")?.name ?? "undefined");

        const mentionable = opts.mentionable.get("mentionabletest");
        if (mentionable == null) {
          await ctx.send("undefined");
        } else if ("username" in mentionable) {
          await ctx.send(`<@${mentionable.id.toString()}>`);
        } else if ("name" in mentionable) {
          await ctx.send(`<@&${mentionable.id.toString()}>`);
        }

        const channel = opts.channel.get("channeltest");
        if (channel == null) {
          await ctx.send("undefined");
        } else {
          await ctx.send(`<#${channel.id.toString()}>` );
        }
      },
    }),
    new Subcommand({
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
        const scope = opts.string.get("scope");
        if (!scope) throw new Error("Could not locate scope argument.");
        const id = opts.string.get("id");
        if (!id) throw new Error("Could not locate ID argument.");
        const property = opts.string.get("property");

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
        if (property != null) {
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
          const returnValueSplit = returnValue.match(/(.{1,1500})/g);
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
      name: "permissions",
      description: "Only the bot host (TheBirdWasHere) should be able to run this command!",
      permissions: ["host"],
      execute: async (ctx) => {
        await ctx.reply("Hello Bird!");
      }
    }),
    new Subcommand({
      name: "cooldown",
      description: "Ensure a cooldown of 5 minutes works as expected.",
      cooldown: 300_000,
      execute: async (ctx) => {
        await ctx.reply("Cooldown is not active!");
      }
    }),
    new Subcommand({
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
