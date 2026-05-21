import { Command, CommandOption, Subcommand } from "@src/utility/command.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, EmbedBuilder, Message, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { ScratchpadNoteData } from "@src/utility/types.js";
import { AutocompleteContext, CommandContext } from "@src/utility/context.js";
import { handleCommandError } from "@src/utility/error.js";

const Scratchpad = new Command({
  name: "scratchpad",
  description: "Jot down notes to copy/paste when needed.",
  subcommands: [
    new Subcommand({//MARK: scratchpad write
      name: "write",
      description: "Append a new note to your scratchpad.",
      options: [
        new CommandOption({
          name: "label",
          description: "The label of your new note, used to easily find it again.",
          type: "string",
        }),
        new CommandOption({
          name: "text",
          description: "The content of your new note.",
          type: "string",
        }),
      ],
      execute: async (ctx, opts) => {
        const label = opts.string.get("label");
        if (!label)
          throw new Error("Unable to locate note label.");

        const text = opts.string.get("text");
        if (!text)
          throw new Error("Unable to locate note text.");

        const newNote: ScratchpadNoteData = {
          label,
          text,
          timestamp: ctx.timestamp,
        };

        const currentNotes = ctx.db.user.fetchOr(ctx.user.id, "scratchpad", []) as ScratchpadNoteData[];
        currentNotes.push(newNote);
        ctx.db.user.update(ctx.user.id, "scratchpad", currentNotes);
        
        await ctx.reply({ 
          content: `Successfully added "${label}" to your scratchpad!`, 
          embeds: [await formatNoteEmbed(ctx, newNote, currentNotes.length)] 
        });
      },
    }),
    new Subcommand({//MARK: scratchpad view
      name: "view",
      description: "View one of your notes.",
      options: [
        new CommandOption({
          name: "note",
          description: "The index of the note you want to view.",
          type: "string",
          autocomplete: true,
        })
      ],
      autocomplete: notesAutocomplete,
      execute: async (ctx, opts) => {
        const userNotes = ctx.db.user.fetchOr(ctx.user.id, "scratchpad", []) as ScratchpadNoteData[];

        if (userNotes.length === 0) {
          await ctx.reply(`It looks like you don't have any notes yet. Try adding some with \`${ctx.prefix}scratchpad write\`!`);
          return;
        }

        const requestedNoteIndex = Number(opts.string.get("note"));
        let pageNum = requestedNoteIndex - 1;

        if (isNaN(requestedNoteIndex))
          throw new Error("Index is not a number.");

        let requestedNote = userNotes.at(pageNum);

        if (requestedNoteIndex === 0 || requestedNote === undefined)
          throw new Error("Couldn't find a note at the requested index.");

        //support negative numbers indexing from the end instead of the start
        let displayNoteIndex = requestedNoteIndex >= 1 ? requestedNoteIndex : userNotes.length + requestedNoteIndex;

        const leftButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId("scratchpad-left")
          .setLabel("🡨");
        const rightButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId("scratchpad-right")
          .setLabel("🡪");
        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(leftButton, rightButton);
                    
        if (pageNum === 0) {
          buttonRow.components[0].setDisabled(true);
        } else {
          buttonRow.components[0].setDisabled(false);
        }

        if (pageNum === userNotes.length - 1) {
          buttonRow.components[1].setDisabled(true);
        } else {
          buttonRow.components[1].setDisabled(false);
        }

        const response = await ctx.reply({ 
          embeds: [await formatNoteEmbed(ctx, requestedNote, displayNoteIndex)],
          components: [buttonRow]
        });

        const buttonFilter = (i: ButtonInteraction): boolean => i.user.id === ctx.user.id;

        const buttonCollector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 120_000,
          filter: buttonFilter,
        });

        //MARK: button handlers
        async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
          const customId = i.customId;
          if (customId == "scratchpad-left") {
            pageNum--;
          } else if (customId == "scratchpad-right") {
            pageNum++;
          } else { //huh what
            await handleCommandError(ctx, "scratchpad", new Error("what did you just press. how did this happen."));
            return;
          }

          requestedNote = userNotes.at(pageNum);
          displayNoteIndex = pageNum >= 0 ? pageNum + 1 : userNotes.length + pageNum + 1;

          if (requestedNote === undefined) {
            await handleCommandError(ctx, "scratchpad", new Error("Could not find an item at the requested index."));
            return;
          }

          if (pageNum === 0) {
            buttonRow.components[0].setDisabled(true);
          } else {
            buttonRow.components[0].setDisabled(false);
          }

          if (pageNum === userNotes.length - 1) {
            buttonRow.components[1].setDisabled(true);
          } else {
            buttonRow.components[1].setDisabled(false);
          }

          await response.edit({embeds: [await formatNoteEmbed(ctx, requestedNote, displayNoteIndex)], components: [buttonRow]});

          await i.deferUpdate();
        }
                    
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonCollector.on("collect", async (i) => {await handleButtonInteraction(i);});

        async function handleButtonTimeout(): Promise<void> {
        //disable the buttons
          buttonRow.components.forEach(item => item.setDisabled(true));
          await response.edit({ components: [buttonRow] });
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonCollector.on("end", async () => {await handleButtonTimeout();});
      }
    }),
    new Subcommand({//MARK: scratchpad edit
      name: "edit",
      description: "Edit one of your notes.",
      options: [
        new CommandOption({
          name: "note",
          description: "The index of the note you want to view.",
          type: "string",
          autocomplete: true,
        })
      ],
      autocomplete: notesAutocomplete,
      execute: async (ctx, opts) => {
        const userNotes = ctx.db.user.fetchOr(ctx.user.id, "scratchpad", []) as ScratchpadNoteData[];

        if (userNotes.length === 0) {
          await ctx.reply(`It looks like you don't have any notes yet. Try adding some with \`${ctx.prefix}scratchpad write\`!`);
          return;
        }

        const requestedNoteIndex = Number(opts.string.get("note"));

        if (isNaN(requestedNoteIndex))
          throw new Error("Index is not a number.");

        const requestedNote = userNotes.at(requestedNoteIndex-1);

        if (requestedNoteIndex === 0 || requestedNote === undefined)
          throw new Error("Couldn't find a note at the requested index.");

        //support negative numbers indexing from the end instead of the start
        const displayNoteIndex = requestedNoteIndex >= 1 ? requestedNoteIndex : userNotes.length + requestedNoteIndex;

        const oldTimestamp = requestedNote.timestamp;

        const modalFields = [
          new ActionRowBuilder<TextInputBuilder>()
            .setComponents(
              new TextInputBuilder()
                .setCustomId("scratchpad-edit-label")
                .setLabel("Note Label")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("The label, used for quick identification.")
                .setValue(requestedNote.label)
                .setRequired(true)
                .setMinLength(1)
            ),
          new ActionRowBuilder<TextInputBuilder>()
            .setComponents(
              new TextInputBuilder()
                .setCustomId("scratchpad-edit-text")
                .setLabel("Note Text")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("The text of your note.")
                .setValue(requestedNote.text)
                .setRequired(true)
                .setMinLength(1)
            ),
        ];

        const editModal = new ModalBuilder()
          .setCustomId("scratchpad-edit")
          .setTitle("Edit Note")
          .setComponents(modalFields);

        async function onModalSubmit(i: ModalSubmitInteraction, _: Message): Promise<void> {
          const newLabel = i.fields.getTextInputValue("scratchpad-edit-label");
          const newText = i.fields.getTextInputValue("scratchpad-edit-text");
          
          const newNote: ScratchpadNoteData = {
            label: newLabel,
            text: newText,
            timestamp: oldTimestamp,
          };

          userNotes[requestedNoteIndex-1] = newNote;
          ctx.db.user.update(ctx.user.id, "scratchpad", userNotes);

          await i.reply({ 
            content: `Successfully edited "${newLabel}"!`, 
            embeds: [await formatNoteEmbed(ctx, newNote, displayNoteIndex)] 
          });
        }

        await ctx.replyModal(editModal, onModalSubmit);
      }
    }),
    new Subcommand({//MARK: scratchpad erase
      name: "erase",
      description: "Remove an old note. Irreversible, so be careful!",
      options: [
        new CommandOption({
          name: "note",
          description: "The index of the note you want to erase.",
          type: "string",
          autocomplete: true,
        })
      ],
      autocomplete: notesAutocomplete,
      execute: async (ctx, opts) => {
        const userNotes = ctx.db.user.fetchOr(ctx.user.id, "scratchpad", []) as ScratchpadNoteData[];

        if (userNotes.length === 0) {
          await ctx.reply(`It looks like you don't have any notes yet. Try adding some with \`${ctx.prefix}scratchpad write\`!`);
          return;
        }

        const requestedNoteIndex = Number(opts.string.get("note"));

        if (isNaN(requestedNoteIndex))
          throw new Error("Index is not a number.");

        const requestedNote = userNotes.at(requestedNoteIndex-1);

        if (requestedNoteIndex === 0 || requestedNote === undefined)
          throw new Error("Couldn't find a note at the requested index.");

        //support negative numbers indexing from the end instead of the start
        const displayNoteIndex = requestedNoteIndex >= 1 ? requestedNoteIndex : userNotes.length + requestedNoteIndex;

        userNotes.splice(requestedNoteIndex-1);
        ctx.db.user.update(ctx.user.id, "quotes", userNotes);

        await ctx.reply({ 
          content: `Successfully deleted "${requestedNote.label}"!`, 
          embeds: [await formatNoteEmbed(ctx, requestedNote, displayNoteIndex)] });
      }
    }),
  ],
});

//MARK: utils
async function notesAutocomplete(ctx: AutocompleteContext): Promise<void> {
  const currentNotes = ctx.db.user.fetchOr(ctx.user.id, "scratchpad", []) as ScratchpadNoteData[];

  await ctx.respond(currentNotes.map((quote, i) => ({ name: `${(i+1).toString()}: ${quote.label}`, value: (i+1).toString()})));
}

function formatNoteEmbed(ctx: CommandContext, note: ScratchpadNoteData, index: number): EmbedBuilder | PromiseLike<EmbedBuilder> {
  const noteEmbed = new EmbedBuilder()
    .setAuthor({ name: `${ctx.user.displayName}'s Scratchpad`, iconURL: ctx.user.displayAvatarURL() })
    .setTitle(`${note.label}:`)
    .setColor(Colors.Blue)
    .setDescription(`\`\`\`\n${note.text}\n\`\`\``)
    .setTimestamp(note.timestamp)
    .setFooter({ text: `Page ${index.toString()}`});

  return noteEmbed;
}

export default Scratchpad;


