import { Command, CommandOption, Subcommand } from "src/utility/command.js";
import { ActionRowBuilder, Colors, EmbedBuilder, Message, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from "discord.js";
import footers from "src/data/footers.json" with { type: "json" };
import { Footers, QuoteData } from "src/utility/types.js";
import { randomChoice } from "src/utility/utility.js";
import { AutocompleteContext, CommandContext } from "src/utility/context.js";

const FOOTERS = footers as Footers;

const Quotes = new Command({
  name: "quotes",
  description: "Write down and recall quotes of your fellow members.",
  subcommands: [
    new Subcommand({//MARK: quotes add
      name: "add",
      description: "Add a quote to this server's record.",
      options: [
        new CommandOption({
          name: "text",
          description: "The content of your new quote.",
          type: "string",
        }),
        new CommandOption({
          name: "quotee",
          description: "The user being quoted.",
          type: "user",
        }),
      ],
      contextmenu: {
        type: "message",
        label: "add to quotes",
        contextOption: "text",
        userContextOption: "quotee"
      },
      execute: async (ctx, opts) => {
        if (!ctx.guild) {
          await ctx.reply("Sorry, you can only add quotes inside a server.");
          return;
        }

        const text = opts.string.get("text");
        if (!text)
          throw new Error("Unable to locate quote text.");

        const quotedUser = opts.user.get("quotee");
        if (!quotedUser)
          throw new Error("Unable to locate quotee.");
        
        const quoteDate = new Date(new Date(ctx.timestamp).toDateString());

        const dateString = quoteDate.toLocaleDateString(undefined, { 
          month: "long", 
          day: "numeric", 
          year: "numeric"
        });

        const newQuoteEmbed = new EmbedBuilder()
          .setTitle(`Quote from ${ctx.guild.name}`)
          .setDescription(`> ${text}`)
          .setFields({ name: `-${quotedUser.displayName} (${dateString})`, value: ""})
          .setColor(Colors.Blue)
          .setThumbnail(quotedUser.displayAvatarURL());

        const newQuote = {
          text,
          userid: quotedUser.id,
          username: quotedUser.displayName,
          date: dateString,
        };

        const currentQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];
        currentQuotes.push(newQuote);
        ctx.db.server.update(ctx.guild.id, "quotes", currentQuotes);
        
        await ctx.reply({ content: `New quote added from <@${quotedUser.id}>!`, embeds: [newQuoteEmbed] });
      },
    }),
    new Subcommand({//MARK: quotes random
      name: "random",
      description: "Pull a random quote from this server.",
      options: [
        new CommandOption({
          name: "member",
          description: "Choose a member to find quotes of. If not set, will choose a random quote across the server.",
          type: "user",
          optional: true,
        })
      ],
      execute: async (ctx, opts) => {
        if (!ctx.guild) {
          await ctx.reply("Sorry, you can only review quotes inside a server.");
          return;
        }

        const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

        if (serverQuotes.length === 0) {
          await ctx.reply(`No quotes were found in this server. Try adding some with \`${ctx.prefix}quotes add\`!`);
          return;
        }

        const filterMember = opts.user.get("member");

        let randomQuote: QuoteData;
        if (filterMember) {
          const filteredQuotes = serverQuotes.filter(quote => quote.userid === filterMember.id);
          if (filteredQuotes.length === 0) {
            await ctx.reply(`No quotes were found from ${filterMember.displayName}. Try adding some with \`${ctx.prefix}quotes add\`!`);
            return;
          }
        
          randomQuote = randomChoice(filteredQuotes);
        } else {
          randomQuote = randomChoice(serverQuotes);
        }

        //might be inaccurate if the same member has two of the same quote, but that shouldn't happen
        const quoteIndex = serverQuotes.findIndex(quote => quote.userid === randomQuote.userid && quote.text === randomQuote.text);

        await ctx.reply({ embeds: [await formatQuoteEmbed(ctx, randomQuote, quoteIndex, "specific")] });
      }
    }),
    new Subcommand({ //MARK: quotes get
      name: "get",
      description: "Grab and display a specific quote.",
      options: [
        new CommandOption({
          name: "quote",
          description: "The index of the requested quote.",
          type: "string",
          autocomplete: true,
        })
      ],
      autocomplete: quotesAutocomplete,
      execute: async (ctx, opts) => {
        if (!ctx.guild) {
          await ctx.reply("Sorry, you can only review quotes inside a server.");
          return;
        }

        const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

        if (serverQuotes.length === 0) {
          await ctx.reply(`No quotes were found in this server. Try adding some with \`${ctx.prefix}quotes add\`!`);
          return;
        }

        const requestedQuoteIndex = Number(opts.string.get("quote"));

        if (isNaN(requestedQuoteIndex))
          throw new Error("Index is not a number.");

        const requestedQuote = serverQuotes.at(requestedQuoteIndex-1);

        if (requestedQuoteIndex === 0 || requestedQuote === undefined)
          throw new Error("Couldn't find a quote at the requested index.");

        //support negative numbers indexing from the end instead of the start
        const displayQuoteIndex = requestedQuoteIndex >= 1 ? requestedQuoteIndex : serverQuotes.length + requestedQuoteIndex;

        await ctx.reply({ embeds: [await formatQuoteEmbed(ctx, requestedQuote, displayQuoteIndex, "specific")] });
      }
    }),
    new Subcommand({ //MARK: quotes edit
      name: "edit",
      description: "Edit a specific quote.",
      options: [
        new CommandOption({
          name: "quote",
          description: "The index of the quote to be edited.",
          type: "string",
          autocomplete: true,
        })
      ],
      autocomplete: quotesAutocomplete,
      execute: async (ctx, opts) => {
        if (!ctx.guild) {
          await ctx.reply("Sorry, you can only delete quotes inside a server.");
          return;
        }

        const hasPermission = await checkPermissions(ctx);
        if (!hasPermission) {
          await ctx.reply("Sorry, editing quotes requires the Manage Messages permission.");
          return;
        }

        const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

        if (serverQuotes.length === 0) {
          await ctx.reply(`No quotes were found in this server. Try adding some with \`${ctx.prefix}quotes add\`!`);
          return;
        }

        const requestedQuoteIndex = Number(opts.string.get("quote"));

        if (isNaN(requestedQuoteIndex))
          throw new Error("Index is not a number.");

        const requestedQuote = serverQuotes.at(requestedQuoteIndex-1);

        if (requestedQuoteIndex === 0 || requestedQuote === undefined)
          throw new Error("Couldn't find a quote at the requested index.");

        //support negative numbers indexing from the end instead of the start
        const displayQuoteIndex = requestedQuoteIndex >= 1 ? requestedQuoteIndex : serverQuotes.length + requestedQuoteIndex;

        const modalFields = [
          new ActionRowBuilder<TextInputBuilder>()
            .setComponents(
              new TextInputBuilder()
                .setCustomId("quotes-edit-date")
                .setLabel("Quote Date")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("The quote's date, ideally formatted as \"Month Day, Year\"")
                .setValue(requestedQuote.date)
                .setRequired(true)
                .setMinLength(1)
            ),
          new ActionRowBuilder<TextInputBuilder>()
            .setComponents(
              new TextInputBuilder()
                .setCustomId("quotes-edit-text")
                .setLabel("Quote Text")
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder("The text of your quote.")
                .setValue(requestedQuote.text)
                .setRequired(true)
                .setMinLength(1)
            ),
          new ActionRowBuilder<TextInputBuilder>()
            .setComponents(
              new TextInputBuilder()
                .setCustomId("quotes-edit-username")
                .setLabel("Quotee Username")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("The default username for the quotee.")
                .setValue(requestedQuote.username)
                .setRequired(true)
                .setMinLength(1)
            ),
          new ActionRowBuilder<TextInputBuilder>()
            .setComponents(
              new TextInputBuilder()
                .setCustomId("quotes-edit-userid")
                .setLabel("Quotee User ID")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Do NOT touch this if you don't know what you're doing!")
                .setValue(requestedQuote.userid)
                .setRequired(true)
                .setMinLength(18)
                .setMaxLength(19)
            )
        ];

        const editModal = new ModalBuilder()
          .setCustomId("quotes-edit")
          .setTitle("Edit Quote")
          .setComponents(modalFields);

        const guildId = ctx.guild.id;

        async function onModalSubmit(i: ModalSubmitInteraction, _: Message): Promise<void> {
          const newDate = i.fields.getTextInputValue("quotes-edit-date");
          const newText = i.fields.getTextInputValue("quotes-edit-text");
          const newUsername = i.fields.getTextInputValue("quotes-edit-username");
          const newId = i.fields.getTextInputValue("quotes-edit-userid");
          
          const newQuote = {
            date: newDate,
            text: newText,
            username: newUsername,
            userid: newId,
          };

          serverQuotes[requestedQuoteIndex-1] = newQuote;
          ctx.db.server.update(guildId, "quotes", serverQuotes);

          await i.reply({ content: "The following quote was successfully edited!", embeds: [await formatQuoteEmbed(ctx, newQuote, displayQuoteIndex, "specific")] });
        }

        await ctx.replyModal(editModal, onModalSubmit);
      }
    }),
    new Subcommand({ //MARK: quotes delete
      name: "delete",
      description: "Delete a specific quote. Irreversible, so be careful!",
      options: [
        new CommandOption({
          name: "quote",
          description: "The index of the quote to be deleted.",
          type: "string",
          autocomplete: true,
        })
      ],
      autocomplete: quotesAutocomplete,
      execute: async (ctx, opts) => {
        if (!ctx.guild) {
          await ctx.reply("Sorry, you can only delete quotes inside a server.");
          return;
        }

        const hasPermission = await checkPermissions(ctx);
        if (!hasPermission) {
          await ctx.reply("Sorry, editing quotes requires the Manage Messages permission.");
          return;
        }
        
        const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

        if (serverQuotes.length === 0) {
          await ctx.reply(`No quotes were found in this server. Try adding some with \`${ctx.prefix}quotes add\`!`);
          return;
        }

        const requestedQuoteIndex = Number(opts.string.get("quote"));

        if (isNaN(requestedQuoteIndex))
          throw new Error("Index is not a number.");

        const requestedQuote = serverQuotes.at(requestedQuoteIndex-1);

        if (requestedQuoteIndex === 0 || requestedQuote === undefined)
          throw new Error("Couldn't find a quote at the requested index.");

        //support negative numbers indexing from the end instead of the start
        const displayQuoteIndex = requestedQuoteIndex >= 1 ? requestedQuoteIndex : serverQuotes.length + requestedQuoteIndex;

        serverQuotes.splice(requestedQuoteIndex-1);
        ctx.db.server.update(ctx.guild.id, "quotes", serverQuotes);

        await ctx.reply({ content: "The following quote was successfully deleted!", embeds: [await formatQuoteEmbed(ctx, requestedQuote, displayQuoteIndex, "specific")] });
      }
    }),
  ],
});

//MARK: utils
async function quotesAutocomplete(ctx: AutocompleteContext): Promise<void> {
  if (!ctx.guild) {
    await ctx.respondMessage("sorry, quoting only works inside a server");
    return;
  }

  const serverQuotes = ctx.db.server.fetchOr(ctx.guild.id, "quotes", []) as QuoteData[];

  await ctx.respond(serverQuotes.map((quote, i) => ({ name: `${(i+1).toString()}: ${quote.text}`, value: (i+1).toString()})));
}

async function checkPermissions(ctx: CommandContext): Promise<boolean> {
  if (!ctx.guild)
    throw new Error("Checked permissions outside guild.");
  
  const serverMember = await ctx.guild.members.fetch(ctx.user.id);

  return serverMember.permissions.has(PermissionFlagsBits.ManageMessages);
}

async function formatQuoteEmbed(ctx: CommandContext, quote: QuoteData, index: number, type: "new" | "random" | "specific"): Promise<EmbedBuilder> {
  if (!ctx.guild)
    throw new Error("Formatted quote outside guild.");

  const quoteEmbed = new EmbedBuilder()
    .setDescription(`> ${quote.text}`)
    .setColor(Colors.Blue);

  switch (type) {
  case "new": {
    quoteEmbed.
      setTitle(`New Quote from ${ctx.guild.name}`)
      .setFooter({ text: `Quote ${String(index+1)}`});
    
    break;
  } case "random": {
    quoteEmbed
      .setTitle(`Random Quote from ${ctx.guild.name}`)
      .setFooter({ text: `Quote ${String(index+1)} ● ${randomChoice(FOOTERS.quotes)}` });
    
    break;
  } case "specific": {
    quoteEmbed
      .setTitle(`Quote from ${ctx.guild.name}`)
      .setFooter({ text: `Quote ${String(index+1)} ● ${randomChoice(FOOTERS.quotes)}` });
    
    break;
  }
  }
        
  try {
    //try to grab the user in the server
    const quotedMember = await ctx.guild.members.fetch(quote.userid);
    quoteEmbed
      .setFields({ name: `-${quotedMember.displayName} (${quote.date})`, value: ""})
      .setThumbnail(quotedMember.displayAvatarURL());
  } catch {
    try {
      //if that fails, grab them outside the server
      const quotedUser = await ctx.data.client.users.fetch(quote.userid);
      quoteEmbed
        .setFields({ name: `-${quotedUser.displayName} (${quote.date})`, value: ""})
        .setThumbnail(quotedUser.displayAvatarURL());
    } catch {
      quoteEmbed
        .setFields({ name: `-${quote.username} (${quote.date})`, value: ""})
        .setThumbnail("https://cdn.discordapp.com/embed/avatars/2.png");
    }
  }

  return quoteEmbed;
}

export default Quotes;