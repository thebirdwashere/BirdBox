import { Command, CommandOption } from "@src/utility/command.js";
import { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction, Interaction, Message } from "discord.js";
import footers from "@src/data/footers.json" with { type: "json" };
import { Footers } from "@src/utility/types.js";
import { randomChoice, sleep } from "@src/utility/utility.js";

const FOOTERS = footers as Footers;

const GRID_SIZE = 3;

const TicTacToe = new Command({
  name: "tictactoe",
  description: "Play Tic-Tac-Toe against another user or the bot.",
  options: [
    new CommandOption({
      name: "opponent",
      description: "Your opponent during the game. If not set, a member may join before the game starts.",
      type: "user",
      optional: true,
    }),
  ],
  contextmenu: {
    label: "challenge to tictactoe",
    type: "user",
    "contextOption": "opponent",
  },
  execute: async (ctx, opts) => {
    //MARK: opponent setup
    let opponentId = opts.user.get("opponent")?.id;
    
    let previousReply = undefined;
    if (opponentId == null) {

      const setupEmbed = new EmbedBuilder()
        .setTitle("Tic-Tac-Toe Setup")
        .setColor(Colors.White)
        .setDescription(`<@${ctx.user.id}> wants to play Tic-Tac-Toe. Care to join?`);
      
      const joinButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setLabel("Join")
        .setCustomId("join-tictactoe-button");
      const botButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Play Against Bot")
        .setCustomId("bot-tictactoe-button");
      
      const joinRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(joinButton, botButton);

      const setupResponse = await ctx.reply({ embeds: [setupEmbed], components: [joinRow] });
      previousReply = setupResponse;

      try {
        const filter = (i: Interaction): boolean => (
          i.isButton() &&
          //make sure, if they selected the bot button, they're the same person who requested to play
          (i.customId !== "bot-tictactoe-button" || i.user.id === ctx.user.id) 
        );
        const i = await setupResponse.awaitMessageComponent({ filter, time: 60_000 }) as ButtonInteraction;
        await i.deferUpdate();

        if (i.customId === "bot-tictactoe-button") {
          opponentId = ctx.data.id;
        } else {
          opponentId = i.user.id;
        }
        
      } catch {
        await setupResponse.edit({ content: `Nobody joined <@${ctx.user.id}>'s game :(`, components: [] });
        return;
      }
    }

    //initialize array of rows of buttons
    const buttonRowArray: ActionRowBuilder<ButtonBuilder>[] = [];
    const boardArray: number[][] = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      const newActionRow = new ActionRowBuilder<ButtonBuilder>();
      const newValueRow = [];

      for (let j = 0; j < GRID_SIZE; j++) {
        const button = new ButtonBuilder()
          .setCustomId(`${i.toString()}${j.toString()}-tictactoe-button`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("➖");
        
        newActionRow.addComponents(button);
        newValueRow.push(-1);
      }

      buttonRowArray.push(newActionRow);
      boardArray.push(newValueRow);
    }

    const players = [ctx.user.id, opponentId];
    const playerSymbols = ["❌", "⭕"];
    let currentPlayer: 0 | 1 = 0;
    let turnIndex = 0;
    let gameOver = false;

    const versusText = `<@${players[currentPlayer]}> vs. <@${players[currentPlayer+1]}>`;

    const gameEmbed = new EmbedBuilder()
      .setTitle("Tic-Tac-Toe")
      .setColor(Colors.Blue)
      .setDescription(versusText)
      .setFields({
        inline: true,
        name: `Player ${String(currentPlayer+1)}'s Turn`,
        value: `<@${players[currentPlayer]}> [${playerSymbols[currentPlayer]}]`
      })
      .setFooter({ text: randomChoice(FOOTERS.tictactoe.start) });
    
    let response: Message;
    if (previousReply === undefined) {
      response = await ctx.reply({ embeds: [gameEmbed], components: buttonRowArray });
    } else {
      response = await previousReply.edit({ embeds: [gameEmbed], components: buttonRowArray });
    }

    //collect button responses
    const buttonCollector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180_000,
    });

    //MARK: execute move
    function executeMove(i: number, j: number): void {
      turnIndex++;

      const triggeredButton = buttonRowArray[i].components[j];

      triggeredButton
        .setEmoji(playerSymbols[currentPlayer])
        .setDisabled(true);
      boardArray[i][j] = currentPlayer;

      //binary negation by inverting as boolean and then casting back to number
      currentPlayer = Number(!currentPlayer) as 0 | 1; 
      gameEmbed.setFields({
        inline: true,
        name: `Player ${String(currentPlayer+1)}'s Turn`,
        value: `<@${players[currentPlayer]}> [${playerSymbols[currentPlayer]}]`
      });

      //randomize footer
      if (turnIndex <= 3) {
        gameEmbed.setFooter({ text: randomChoice(FOOTERS.tictactoe.early) });
      } else {
        gameEmbed.setFooter({ text: randomChoice(FOOTERS.tictactoe.late) });
      }
    }

    //MARK: handle win/tie
    async function handleWinOrTie(): Promise<void> {
      const winnerData = detectWinner(boardArray);
      if (winnerData !== undefined) {
        const winnerId = players[winnerData[0]];

        let extraComment = "";
        if (winnerId === ctx.data.id) extraComment = " get smoked fr";
        if (players[Number(!winnerData[0])] === ctx.data.id) extraComment = " not bad";
        await response.reply(`<@${winnerId.toString()}> wins!${extraComment}`);

        for (const [x, y] of winnerData[1]) {
          buttonRowArray[x].components[y]
            .setStyle(ButtonStyle.Success);
        }

        gameEmbed
          .setColor(Colors.Green)
          .setFields({
            inline: true,
            name: `Player ${String(currentPlayer+1)} Wins`,
            value: `Congrats <@${winnerId.toString()}>!`
          })
          .setFooter({ text: randomChoice(FOOTERS.tictactoe.win) });

        disableButtons();

        gameOver = true;
      } else {
        const tieGame = boardArray.flat(1).every(square => square !== -1);

        if (tieGame) {
          disableButtons();

          let extraComment = "";
          if (players.includes(ctx.data.id)) extraComment = " ggs tough one";
          await response.reply(`It's a cat game!${extraComment}`);
          gameEmbed
            .setColor(Colors.Red)
            .setFields({
              inline: true,
              name: "Tie Game",
              value: "No one wins"
            })
            .setFooter({ text: randomChoice(FOOTERS.tictactoe.nowin) });

          gameOver = true;
        }
      }
    }

    //MARK: handle play
    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      const currentPlayerId = players[currentPlayer];
      if (i.user.id !== currentPlayerId) {
        if (!players.includes(i.user.id)) {
          await i.reply(`<@${i.user.id}> what are you doing bruh you're not even in this game`);
          return;
        } else {
          await i.reply(`<@${i.user.id}> wait your turn bruh`);
          return;
        }
      }

      executeMove(Number(i.customId[0]), Number(i.customId[1]));
      await handleWinOrTie();

      await i.deferUpdate();
      await response.edit({ embeds: [gameEmbed], components: buttonRowArray });

      if (!gameOver && players[currentPlayer] === ctx.data.id) {
        await sleep(1500);
        const move = birdboxAI(boardArray);

        executeMove(...move);
        await handleWinOrTie();

        await response.edit({ embeds: [gameEmbed], components: buttonRowArray });
      }
    }

    function disableButtons(): void {
      buttonRowArray.forEach((row) => {
        row.components.forEach(
          (button) => {
            button.setDisabled(true);
          }
        );
      });
    }

    async function handleButtonTimeout(): Promise<void> {
      disableButtons();

      if (!gameOver) {
        gameEmbed
          .setDescription("Game timed out.")
          .setFooter({ text: randomChoice(FOOTERS.tictactoe.nowin) });
      }

      await response.edit({ embeds: [gameEmbed], components: buttonRowArray });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", async (i: ButtonInteraction) => {await handleButtonInteraction(i);});
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", async () => {await handleButtonTimeout();});
  },
});

export default TicTacToe;

type CoordinatePair = [number, number];

//MARK: detect winner
function detectWinner(board: number[][]): 
  [number, [CoordinatePair, CoordinatePair, CoordinatePair]] | undefined 
{
  const middlePlayer = board[1][1];
  
  if (middlePlayer !== -1) {
    if (board[0][0] === middlePlayer && board[2][2] === middlePlayer) { //back diagonal
      return [middlePlayer, [[0, 0], [1, 1], [2, 2]]];
    } else if (board[0][2] === middlePlayer && board[2][0] === middlePlayer) { //front diagonal
      return [middlePlayer, [[0, 2], [1, 1], [2, 0]]];
    } else if (board[1][0] === middlePlayer && board[1][2] === middlePlayer) { //across the middle
      return [middlePlayer, [[1, 0], [1, 1], [1, 2]]];
    } else if (board[0][1] === middlePlayer && board[2][1] === middlePlayer) { //down the middle
      return [middlePlayer, [[0, 1], [1, 1], [2, 1]]];
    }
  }

  const topLeftPlayer = board[0][0];

  if (topLeftPlayer !== -1) {
    if (board[0][1] === topLeftPlayer && board[0][2] === topLeftPlayer) { //across the top
      return [topLeftPlayer, [[0, 0], [0, 1], [0, 2]]];
    } else if (board[1][0] === topLeftPlayer && board[2][0] === topLeftPlayer) { //down the left side
      return [topLeftPlayer, [[0, 0], [1, 0], [2, 0]]];
    }
  }

  const bottomRightPlayer = board[2][2];

  if (bottomRightPlayer !== -1) {
    if (board[0][2] === bottomRightPlayer && board[1][2] === bottomRightPlayer) { //down the right side
      return [bottomRightPlayer, [[0, 2], [1, 2], [2, 2]]];
    } else if (board[2][0] === bottomRightPlayer && board[2][1] === bottomRightPlayer) { //across the bottom
      return [bottomRightPlayer, [[2, 0], [2, 1], [2, 2]]];
    }
  }
}

//MARK: AI handler
function testRow(row: number[], player: 0 | 1): 0 | 1 | 2 | undefined {
  if (player === row[0] && player === row[1] && row[2] === -1) {
    return 2;
  } else if (player === row[1] && player === row[2] && row[0] === -1) {
    return 0;
  } else if (player === row[0] && player === row[2] && row[1] === -1) {
    return 1;
  }
}

function findFutureWin(board: number[][], player: 0 | 1): CoordinatePair | undefined {
  const topRow = testRow(board[0], player);
  if (topRow !== undefined) return [0, topRow];
  const middleRow = testRow(board[1], player);
  if (middleRow !== undefined) return [1, middleRow];
  const bottomRow = testRow(board[2], player);
  if (bottomRow !== undefined) return [2, bottomRow];

  const leftCol = testRow(board.map(row => row[0]), player);
  if (leftCol !== undefined) return [leftCol, 0];
  const middleCol = testRow(board.map(row => row[1]), player);
  if (middleCol !== undefined) return [middleCol, 1];
  const rightCol = testRow(board.map(row => row[2]), player);
  if (rightCol !== undefined) return [rightCol, 2];

  const backDiagonal = testRow(board.map((row, i) => row[i]), player);
  if (backDiagonal !== undefined) return [backDiagonal, backDiagonal];
  //what is this jank dude, i promise it works tho
  const frontDiagonal = testRow(board.slice().reverse().map((row, i) => row[i]), player);
  if (frontDiagonal !== undefined) return [(-(frontDiagonal - 1) + 1), frontDiagonal];
}

function birdboxAI(board: number[][]): CoordinatePair {
  const potentialWin = findFutureWin(board, 1);
  if (potentialWin !== undefined) return potentialWin;

  const blockingMove = findFutureWin(board, 0);
  if (blockingMove !== undefined) return blockingMove;

  const potentialMoves = board
    .flat()
    .map((value, index) => {
      if (value === -1) {
        const rowNum = Math.floor(index/3);
        const colNum = index % 3;
        return [colNum, rowNum];
      }
    })
    .filter(item => item !== undefined);

  if (potentialMoves.length === 0)
    throw new Error("Could not find a suitable move.");
  
  const moveChoice = randomChoice(potentialMoves);
  return moveChoice as CoordinatePair;
}
