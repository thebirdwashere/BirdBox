import { Command } from "@src/utility/command.js";
import { CoordinatePair } from "@src/utility/types.js";
import { randomChoice, sleep } from "@src/utility/utility.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, EmbedBuilder, Interaction } from "discord.js";

const GRID_SIZE = 10;
const WAIT_TIME = 750;
const SCORE_PER_FRUIT = 200;

const INITAL_SNAKE: CoordinatePair[] = [[1, 3], [1, 2], [1, 1]];
const INITIAL_SNAKE_LENGTH = INITAL_SNAKE.length;

const BLANK_SQUARE = "⬛";
const SNAKE_HEAD_SQUARE = "🟢";
const SNAKE_BODY_SQUARE = "🟩";
const FRUIT_SQUARE = "🍎";

const Snake = new Command({
  name: "snake",
  description: "The classic snake game, playable (if only barely) on BirdBox!",
  execute: async (ctx) => {
    //https://stackoverflow.com/questions/53992415/how-to-fill-multidimensional-array-in-javascript
    let gameGrid = Array(GRID_SIZE).fill([]).map((): string[] => Array(GRID_SIZE).fill(BLANK_SQUARE) as string[]);
    const snakeSegments: CoordinatePair[] = [...INITAL_SNAKE];
    let snakeDirection: "n" | "s" | "w" | "e" | undefined;
    let fruitLocation: CoordinatePair = getNewFruitLocation(snakeSegments);
    
    gameGrid = drawElements(snakeSegments, fruitLocation);
    const snakeEmbed = new EmbedBuilder()
      .setTitle("Snake")
      .setColor(Colors.Blue)
      .setDescription(renderGrid(gameGrid, snakeSegments.length - INITIAL_SNAKE_LENGTH));

    const buttonsRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents([
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId("snake-move-w")
          .setLabel("🠈"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId("snake-move-n")
          .setLabel("🠉"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId("snake-move-s")
          .setLabel("🠋"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId("snake-move-e")
          .setLabel("🠊")
      ]);

    const response = await ctx.reply({embeds: [snakeEmbed], components: [buttonsRow]});

    const filter = (i: Interaction): boolean => i.user.id === ctx.user.id;
    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 7_200_000, filter });

    async function handleButtonInteraction(i: ButtonInteraction): Promise<void> {
      await i.deferUpdate();
      
      const newDirection = (/snake-move-(.)/.exec(i.customId))?.at(1);
      switch (newDirection) {
      case undefined: {
        throw new Error("Error locating button ID.");
      } case "n": case "s": {
        buttonsRow.components[0].setDisabled(false);
        buttonsRow.components[1].setDisabled(true);
        buttonsRow.components[2].setDisabled(true);
        buttonsRow.components[3].setDisabled(false);
        break;
      } case "w": case "e": {
        buttonsRow.components[0].setDisabled(true);
        buttonsRow.components[1].setDisabled(false);
        buttonsRow.components[2].setDisabled(false);
        buttonsRow.components[3].setDisabled(true);
        break;
      } default: {
        throw new Error("Error matching button ID.");
      }
      }

      await response.edit({ components: [buttonsRow] });
      snakeDirection = newDirection;
    }

    async function handleButtonTimeout(): Promise<void> {
      //disable the buttons
      buttonsRow.components.forEach(item => item.setDisabled(true));
      await response.edit({ components: [buttonsRow] });
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("collect", (i: ButtonInteraction): Promise<void> => handleButtonInteraction(i) );
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", (): Promise<void> => handleButtonTimeout() );

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      await sleep(WAIT_TIME);

      const currentHeadCoords = snakeSegments[0];

      switch (snakeDirection) {
      case "n": {
        snakeSegments.unshift([currentHeadCoords[0] - 1, currentHeadCoords[1]]);
        break;
      } case "s": {
        snakeSegments.unshift([currentHeadCoords[0] + 1, currentHeadCoords[1]]);
        break;
      } case "e": {
        snakeSegments.unshift([currentHeadCoords[0], currentHeadCoords[1] + 1]);
        break;
      } case "w": {
        snakeSegments.unshift([currentHeadCoords[0], currentHeadCoords[1] - 1]);
        break;
      } case undefined: {
        continue;
      }
      }

      if (!snakeSegments[0].flat().every(num => 
        num >= 0 && num < GRID_SIZE
      )) {
        break;
      }

      const targetSquare = gameGrid[snakeSegments[0][0]][snakeSegments[0][1]];

      if (targetSquare === SNAKE_BODY_SQUARE) {
        break;
      } else if (targetSquare === FRUIT_SQUARE) {
        fruitLocation = getNewFruitLocation(snakeSegments);
      } else {
        snakeSegments.pop();
      }

      gameGrid = drawElements(snakeSegments, fruitLocation);

      snakeEmbed.setDescription(renderGrid(gameGrid, snakeSegments.length - INITIAL_SNAKE_LENGTH));
      await response.edit({embeds: [snakeEmbed]});
    }

    snakeEmbed
      .setColor(Colors.Red)
      .setTitle("Snake - Game Over");

    buttonsRow.components.forEach(item => item.setDisabled(true));

    await response.edit({ embeds: [snakeEmbed], components: [buttonsRow] });
  },
});

function createBlankGrid(): string[][] {
  return Array(GRID_SIZE).fill([]).map((): string[] => Array(GRID_SIZE).fill(BLANK_SQUARE) as string[]);
}

function getNewFruitLocation(snake: CoordinatePair[]): CoordinatePair {
  //workaround to avoid comparing arrays which doesn't work in JS
  const stringSnake = snake.map(coords => coords.join(","));

  const validLocations = Array(GRID_SIZE).fill([])
    .map((_, i) => [Array(GRID_SIZE).fill([]).map((_, j) => [i, j])])
    .flat(2)
    .filter(coord => !stringSnake.includes(coord.join(",")));

  return randomChoice(validLocations) as CoordinatePair;
}

function drawTo(grid: string[][], xy: CoordinatePair, square: string): void {
  grid[xy[0]][xy[1]] = square;
}

function drawElements(snake: CoordinatePair[], fruit: CoordinatePair): string[][] {
  const grid = createBlankGrid();
  drawTo(grid, snake[0], SNAKE_HEAD_SQUARE);
  for (const seg of snake.slice(1)) {
    drawTo(grid, seg, SNAKE_BODY_SQUARE);
  }

  drawTo(grid, fruit, FRUIT_SQUARE);

  return grid;
}

function renderGrid(grid: string[][], fruitEaten: number): string {
  // eslint-disable-next-line no-irregular-whitespace
  return `Score: ${String(fruitEaten * SCORE_PER_FRUIT)}\n                 \n` 
  + grid.map(row => row.join("")).reduce((acc, curr) => acc + curr + "\n  ", "  ");
}

export default Snake;
