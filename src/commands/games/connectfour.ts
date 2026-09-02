import { Command, CommandOption } from "@src/utility/command.js";
import { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction, Interaction, Message } from "discord.js";
import footers from "@src/data/footers.json" with { type: "json" };
import { CoordinatePair, Footers } from "@src/utility/types.js";
import { create2DArray, randomChoice, sleep } from "@src/utility/utility.js";

const FOOTERS = footers as Footers;

const GRID_WIDTH = 7;
const GRID_HEIGHT = 6;
const PLAYER_CHECKERS = ["🔴", "🔵"];
const WINNER_CHECKERS = ["🟥", "🟦"];
const BLANK_CELL = "⚫";
const BOTTOM_ROW = "1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣";
const AI_MOVE_TIME = 1500;

const ConnectFour = new Command({
  name: "connectfour",
  description: "Play Connect Four against another user or the bot.",
  options: [
    new CommandOption({
      name: "opponent",
      description: "Your opponent during the game. If not set, a member may join before the game starts.",
      type: "user",
      optional: true,
    }),
  ],
  contextmenu: {
    label: "challenge to connect four",
    type: "user",
    "contextOption": "opponent",
  },
  execute: async (ctx, opts) => {
    //MARK: opponent setup
    let opponentId = opts.user.getOptional("opponent")?.id;
    
    if (opponentId == null) {

      const setupEmbed = new EmbedBuilder()
        .setTitle("Connect Four Setup")
        .setColor(Colors.White)
        .setDescription(`<@${ctx.user.id}> wants to play Connect Four. Care to join?`);
      
      const joinButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setLabel("Join")
        .setCustomId("join-connectfour-button");
      const botButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Play Against Bot")
        .setCustomId("bot-connectfour-button");
      
      const joinRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(joinButton, botButton);

      const joinMessage = await ctx.reply({ embeds: [setupEmbed], components: [joinRow] });

      try {
        const filter = (i: Interaction): boolean => (
          i.isButton() &&
          //make sure, if they selected the bot button, they're the same person who requested to play
          (i.customId !== "bot-connectfour-button" || i.user.id === ctx.user.id) 
        );
        const i = await joinMessage.awaitMessageComponent({ filter, time: 60_000 }) as ButtonInteraction;
        await i.deferUpdate();

        if (i.customId === "bot-connectfour-button") {
          opponentId = ctx.data.id;
        } else {
          opponentId = i.user.id;
        }
        
      } catch {
        await joinMessage.edit({ content: `Nobody joined <@${ctx.user.id}>'s game :(`, components: [] });
        return;
      }
    }

    //height and width are INTENTIONALLY the wrong way around, because i wanted arrays vertical for easy piece insertion
    let gameGrid = create2DArray(GRID_HEIGHT, GRID_WIDTH, BLANK_CELL);

    const players = [ctx.user.id, opponentId] as const;
    let currentPlayer: 0 | 1 = 0;
    let turnIndex = 0;
    let gameOver = false;

    const versusText = `<@${players[currentPlayer]}> vs. <@${players[currentPlayer+1]}>`;

    const gameEmbed = new EmbedBuilder()
      .setTitle("Connect Four")
      .setColor(Colors.Red)
      .setDescription(versusText)
      .setFields({
        name: `Player ${String(currentPlayer+1)}'s Turn`,
        value: `<@${players[currentPlayer]}> [${PLAYER_CHECKERS[currentPlayer]}]`
      },
      {
        name: "",
        value: renderGrid(gameGrid)
      })
      .setFooter({ text: randomChoice(FOOTERS.tictactoe.start) });

    const buttonRowArray = [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("connectfour-button0")
            .setEmoji("1️⃣")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("connectfour-button1")
            .setEmoji("2️⃣")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("connectfour-button2")
            .setEmoji("3️⃣")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("connectfour-button3")
            .setEmoji("4️⃣")
            .setStyle(ButtonStyle.Secondary)
        ),
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("connectfour-button4")
            .setEmoji("5️⃣")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("connectfour-button5")
            .setEmoji("6️⃣")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("connectfour-button6")
            .setEmoji("7️⃣")
            .setStyle(ButtonStyle.Secondary)
        )
    ];
    
    if (ctx.lastReply == null) {
      await ctx.reply({ embeds: [gameEmbed], components: buttonRowArray });
    } else {
      await ctx.lastReply.edit({ embeds: [gameEmbed], components: buttonRowArray });
    }

    //collect button responses
    ctx.collectInteractions({
      type: ComponentType.Button,
      idleTimeLimit: 120_000,
      onInteraction,
      onTimeout
    });

    function executeMove(i: ButtonInteraction): void {
      turnIndex++;

      const columnInput = /connectfour-button(.)/.exec(i.customId)?.at(1);
      if (columnInput == undefined) {
        throw new Error("Unable to locate button number.");
      }

      const columnNum = Number(columnInput);
      if (isNaN(columnNum)) {
        throw new Error("Unable to parse column number.");
      } else if (0 > columnNum || columnNum > 6) {
        throw new Error("Column number out of range.");
      }

      const currentChecker = PLAYER_CHECKERS[currentPlayer];
      gameGrid = addToColumn(gameGrid, columnNum, currentChecker);

      if (gameGrid[columnNum].every(cell => cell !== BLANK_CELL)) {
        buttonRowArray[+(columnNum > 3)].components[columnNum % 4].setDisabled(true);
      }

      //binary negation by inverting as boolean and then casting back to number
      currentPlayer = Number(!currentPlayer) as 0 | 1; 
      gameEmbed.setFields({
        name: `Player ${String(currentPlayer+1)}'s Turn`,
        value: `<@${players[currentPlayer]}> [${PLAYER_CHECKERS[currentPlayer]}]`
      },
      {
        name: "",
        value: renderGrid(gameGrid)
      });
    }

    async function handleWinOrTie(msg: Message): Promise<void> {
      const playerNumGrid = gameGrid.map(col => col.map(cell => PLAYER_CHECKERS.indexOf(cell)));
      const winnerData = detectWinner(playerNumGrid);
      if (winnerData !== undefined) {
        const winnerId = players[winnerData[0]];
        let extraComment = "";
        if (winnerId === ctx.data.id) extraComment = " get smoked fr";
        if (players[Number(!winnerData[0])] === ctx.data.id) extraComment = " not bad";
        await msg.reply(`<@${winnerId.toString()}> wins!${extraComment}`);

        for (const [x, y] of winnerData[1]) {
          gameGrid[x][y] = WINNER_CHECKERS[winnerData[0]];
        }

        gameEmbed
          .setColor(Colors.Green)
          .setFields([
            {
              name: `Player ${String(currentPlayer+1)} Wins`,
              value: `Congrats <@${winnerId.toString()}>!`
            },
            {
              name: "",
              value: renderGrid(gameGrid)
            }
          ])
          .setFooter({ text: randomChoice(FOOTERS.tictactoe.win) });

        disableButtons();

        gameOver = true;
      } else {
        const tieGame = buttonRowArray
          .map(row => row.components)
          .flat()
          .every(button => button.data.disabled);

        if (tieGame) {
          let extraComment = "";
          if (players.includes(ctx.data.id)) extraComment = " ggs tough one";
          await msg.reply(`It's a tie!${extraComment}`);
          gameEmbed
            .setColor(Colors.Red)
            .setFields([
              {
                name: "Tie Game",
                value: "No one wins"
              },
              {
                name: "",
                value: renderGrid(gameGrid)
              }
            ])
            .setFooter({ text: randomChoice(FOOTERS.tictactoe.nowin) });

          gameOver = true;
        }
      }
    }

    //MARK: handle play
    async function onInteraction(msg: Message, i: ButtonInteraction): Promise<void> {
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

      executeMove(i);
      await handleWinOrTie(msg);

      await i.deferUpdate();
      await msg.edit({ embeds: [gameEmbed], components: buttonRowArray });
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

    async function onTimeout(msg: Message): Promise<void> {
      disableButtons();

      if (!gameOver) {
        gameEmbed
          .setDescription("Game timed out.")
          .setFooter({ text: randomChoice(FOOTERS.tictactoe.nowin) });
      }

      await msg.edit({ embeds: [gameEmbed], components: buttonRowArray });
    }
  }
});

export default ConnectFour;

type XYDirection = [-1 | 0 | 1, -1 | 0 | 1];

function detectWinner(numGrid: number[][]):
  [number, [CoordinatePair, CoordinatePair, CoordinatePair, CoordinatePair]] | undefined
{
  console.log(numGrid);

  for (let col = 0; col < numGrid[0].length; col++) {
    if (numGrid[3][col] === -1)
      continue;

    const horizontalTest = testWinnerAt(numGrid, [3, col], [-1, 0], [1, 0]);
    if (horizontalTest !== undefined) return horizontalTest;

    const frontDiagonalTest = testWinnerAt(numGrid, [3, col], [-1, -1], [1, 1]);
    if (frontDiagonalTest !== undefined) return frontDiagonalTest;

    const backDiagonalTest = testWinnerAt(numGrid, [3, col], [-1, 1], [1, -1]);
    if (backDiagonalTest !== undefined) return backDiagonalTest;
  }

  for (let row = 0; row < numGrid.length; row++) {
    if (numGrid[row][3] === -1)
      continue;

    const verticalTest = testWinnerAt(numGrid, [row, 3], [0, -1], [0, 1]);
    if (verticalTest !== undefined) return verticalTest;
  }

  return undefined;
}

function testWinnerAt(numGrid: number[][], coords: CoordinatePair, leftDirection: XYDirection, rightDirection: XYDirection):
  [number, [CoordinatePair, CoordinatePair, CoordinatePair, CoordinatePair]] | undefined
{
  const [scoreLeft, visitedLeft] = testWinnerRecursive(0, [], numGrid, coords, leftDirection);
  const [scoreRight, visitedRight] = testWinnerRecursive(0, [], numGrid, coords, rightDirection);

  if ((scoreLeft + scoreRight + 1) >= 4) {
    const allInRow: CoordinatePair[] = [coords].concat(visitedLeft).concat(visitedRight);
    if (allInRow.length > 4) {
      allInRow.splice(4);
    }

    return [numGrid[coords[0]][coords[1]], allInRow as [CoordinatePair, CoordinatePair, CoordinatePair, CoordinatePair]];
  }

  return undefined;
}

function testWinnerRecursive(
  tally: number,
  visited: CoordinatePair[],
  numGrid: number[][], 
  current: CoordinatePair, 
  direction: XYDirection
): [number, CoordinatePair[]] {
  const next: [number, number] = [current[0]+direction[0], current[1]+direction[1]];

  //failsafe if indexing goes too far
  if (
    next[0] < 0
    || next[0] > 6
    || next[1] < 0
    || next[1] > 5
  ) {
    return [tally, visited];
  }

  // console.log(`current: ${current.toString()} ${String(numGrid[current[0]][current[1]])}`);
  // console.log(`next: ${next.toString()} ${String(numGrid[next[0]][next[1]])}`);

  if (numGrid[current[0]][current[1]] === numGrid[next[0]][next[1]]) {
    visited.push(next);
    return testWinnerRecursive(tally+1, visited, numGrid, next, direction);
  } else {
    return [tally, visited];
  }
}

function renderGrid(grid: string[][]): string {
  return grid.map((_, i) => grid.map(row => row[i]).join(" ")).join("\n") + BOTTOM_ROW;
}

function addToColumn(grid: string[][], col: number, checker: string): string[][] {
  const column = grid[col];

  for (let i = column.length - 1; i >= 0; i--) {
    if (column[i] === BLANK_CELL) {
      grid[col][i] = checker;
      return grid;
    }
  }

  throw new Error("Couldn't insert into column.");
}

// function oldDetectWinner() {
//   //index down from the top of the grid until it becomes impossible to have a vertical four-in-a-row
//   for (let i = playerNumGrid[0].length - 1; i > 2; i--) {
//     for (let j = 0; j < playerNumGrid.length; j++) {
//       const checkedCell = playerNumGrid[j][i];
//       if (checkedCell === -1) {
//         continue;
//       }

//       if ( //straight down
//         checkedCell == playerNumGrid[j][i-1]
//         && checkedCell == playerNumGrid[j][i-2]
//         && checkedCell == playerNumGrid[j][i-3]
//       ) {
//         return [checkedCell, [[j, i], [j, i-1], [j, i-2], [j, i-3]]];
//       } else if ( // this diagonal: /
//         j > 2 && 
//         checkedCell == playerNumGrid[j-1][i-1]
//         && checkedCell == playerNumGrid[j-2][i-2]
//         && checkedCell == playerNumGrid[j-3][i-3]
//       ) {
//         return [checkedCell, [[j, i], [j-1, i-1], [j-2, i-2], [j-3, i-3]]];
//       } else if ( // this diagonal: \
//         j < 4 &&
//         checkedCell == playerNumGrid[j+1][i-1]
//         && checkedCell == playerNumGrid[j+2][i-2]
//         && checkedCell == playerNumGrid[j+3][i-3]
//       ) {
//         return [checkedCell, [[j, i], [j+1, i-1], [j+2, i-2], [j+3, i-3]]];
//       }
//     };
//   }
// }