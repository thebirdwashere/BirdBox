import { Subcommand } from "@src/utility/command.js";
import { WordleGameData } from "@src/utility/types.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, Message } from "discord.js";
import { encryptWordCode, createWordleEmbed, handleUsedLettersDisplay } from "./utils.js";

const WordleResume = new Subcommand({
  name: "resume",
  description: "View your ongoing game, if one exists.",
  execute: async (ctx) => {
    const sessionValue = ctx.db.user.fetchOrUndefined(ctx.user.id, "activeWordle") as WordleGameData | undefined;

    if (sessionValue === undefined) {
      await ctx.reply("how bout you start a game before trying to guess lol");
      return;
    }

    const currentSession: WordleGameData = sessionValue;

    //get solution code for display
    const encryptedSolution = encryptWordCode(currentSession.solution);

    //create embed
    const wordleEmbed = createWordleEmbed(currentSession.guesses, encryptedSolution, currentSession.fields);

    //create button to see used letters thus far
    const usedLettersButton = new ButtonBuilder()
      .setCustomId("wordle-used-letters")
      .setLabel("See Used Letters")
      .setStyle(ButtonStyle.Secondary);

    const wordleActionRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(usedLettersButton);

    //send message
    await ctx.reply({ embeds: [wordleEmbed], components: [wordleActionRow] });

    ctx.collectInteractions({
      type: ComponentType.Button,
      timeLimit: 60_000,
      onInteraction,
      onTimeout,
    });

    async function onInteraction(msg: Message, i: ButtonInteraction): Promise<void> {
      const keyboardText = handleUsedLettersDisplay(currentSession.fields);
      await i.reply({ content: keyboardText });
      await onTimeout(msg);
    }

    async function onTimeout(msg: Message): Promise<void> {
      wordleActionRow.components[0].setDisabled(true);
      await msg.edit({ components: [wordleActionRow] });
    }
  },
});

export default WordleResume;
