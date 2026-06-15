import { Command } from "@src/utility/command.js";
import { sleep } from "@src/utility/utility.js";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ComponentType, EmbedBuilder, Interaction } from "discord.js";

const GRID_SIZE = 10;
const INITAL_SNAKE_HEAD: [number, number] = [1, 1];
const INITAL_SNAKE_TAIL: [number, number] = [1, 0];

const BLANK_TILE = "⬛";
const SNAKE_HEAD_TILE = "🟢";
const SNAKE_BODY_TILE = "🟩";
const FRUIT_TILE = "🍎";

const Snake = new Command({
  name: "snake",
  description: "The classic snake game, playable (if only barely) on BirdBox!",
  execute: async (ctx) => {
    const game = new SnakeGame();

    const snakeEmbed = new EmbedBuilder()
      .setTitle("Snake")
      .setDescription(game.renderGrid());

    const buttonsRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents([
        new ButtonBuilder()
          .setCustomId("snake-move-w")
          .setEmoji("🠈"),
        new ButtonBuilder()
          .setCustomId("snake-move-n")
          .setEmoji("🠉"),
        new ButtonBuilder()
          .setCustomId("snake-move-s")
          .setEmoji("🠋"),
        new ButtonBuilder()
          .setCustomId("snake-move-e")
          .setEmoji("🠊")
      ]);

    const response = await ctx.reply({embeds: [snakeEmbed], components: [buttonsRow]});

    const filter = (i: Interaction): boolean => i.user.id === ctx.user.id;
    const buttonCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000, filter });

    function handleButtonInteraction(i: ButtonInteraction): void {
      const newDirection = (/snake-move-(.)/.exec(i.customId))?.at(1);
      if (
        newDirection === undefined || (
          newDirection !== "n" 
          && newDirection !== "s" 
          && newDirection !== "w" 
          && newDirection !== "e" 
        )
      ) {
        throw new Error("Error matching button ID.");
      }
      game.snakeDirection = newDirection;
    }

    async function handleButtonTimeout(): Promise<void> {
      //disable the buttons
      buttonsRow.components.forEach(item => item.setDisabled(true));
      await response.edit({ components: [buttonsRow] });
    }

    buttonCollector.on("collect", (i: ButtonInteraction): void => { handleButtonInteraction(i); } );
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    buttonCollector.on("end", (): Promise<void> => handleButtonTimeout() );

    await sleep(1000);

    game.step();
    snakeEmbed.setDescription(game.renderGrid());

    await response.reply({embeds: [snakeEmbed]});
  },
});

class SnakeGame {
  grid: string[][];
  lastSnakeHead: [number, number];
  snakeHead: [number, number];
  lastSnakeTail: [number, number];
  snakeTail: [number, number];
  snakeDirection: "n" | "s" | "w" | "e";
  gameOver: boolean;

  renderGrid(): string {
    return this.grid.map(row => row.join("")).reduce((acc, curr) => acc + curr + "\n", "");
  }

  drawTo(xy: [number, number], tile: string): void {
    this.grid[xy[0]][xy[1]] = tile;
  }

  drawSnake(): void {
    this.drawTo(this.lastSnakeHead, SNAKE_BODY_TILE);
    this.drawTo(this.snakeHead, SNAKE_HEAD_TILE);
    this.drawTo(this.lastSnakeTail, BLANK_TILE);
  }

  drawAndGrowSnake(): void {
    this.drawTo(this.lastSnakeHead, SNAKE_BODY_TILE);
    this.drawTo(this.snakeHead, SNAKE_HEAD_TILE);
  }

  step(): boolean {
    let newHeadCoords: [number, number], newTailCoords: [number, number];

    switch (this.snakeDirection) {
    case "n": {
      newHeadCoords = [this.snakeHead[0] - 1, this.snakeHead[1]];
      newTailCoords = [this.snakeTail[0] - 1, this.snakeTail[1]];
      break;
    } case "s": {
      newHeadCoords = [this.snakeHead[0] + 1, this.snakeHead[1]];
      newTailCoords = [this.snakeTail[0] + 1, this.snakeTail[1]];
      break;
    } case "e": {
      newHeadCoords = [this.snakeHead[0], this.snakeHead[1] + 1];
      newTailCoords = [this.snakeTail[0], this.snakeTail[1] + 1];
      break;
    } case "w": {
      newHeadCoords = [this.snakeHead[0], this.snakeHead[1] - 1];
      newTailCoords = [this.snakeTail[0], this.snakeTail[1] - 1];
      break;
    }
    }

    if (!newHeadCoords.concat(newTailCoords).flat().every(num => 
      num >= 0 && num < GRID_SIZE
    )) {
      this.gameOver = true;
      return false;
    }

    this.lastSnakeHead = this.snakeHead;
    this.lastSnakeTail = this.snakeTail;
    this.snakeHead = newHeadCoords;
    this.snakeTail = newTailCoords;

    const targetTile = this.grid[newHeadCoords[0]][newHeadCoords[1]];
    if (targetTile === SNAKE_BODY_TILE || targetTile === SNAKE_HEAD_TILE) {
      this.gameOver = true;
      return false;
    } else if (targetTile === FRUIT_TILE) {
      this.drawAndGrowSnake();
    } else {
      this.drawSnake();
    }

    return true;
  }

  constructor() {
    //https://stackoverflow.com/questions/53992415/how-to-fill-multidimensional-array-in-javascript
    this.grid = Array(GRID_SIZE).fill([]).map((): string[] => Array(GRID_SIZE).fill(BLANK_TILE) as string[]);
    
    this.lastSnakeHead = INITAL_SNAKE_HEAD;
    this.snakeHead = INITAL_SNAKE_HEAD;
    this.lastSnakeTail = INITAL_SNAKE_TAIL;
    this.snakeTail = INITAL_SNAKE_TAIL;
    this.snakeDirection = "e";
    this.gameOver = false;

    this.drawTo(this.snakeHead, SNAKE_HEAD_TILE);
    this.drawTo(this.snakeTail, SNAKE_BODY_TILE);

    this.drawTo([1, 2], FRUIT_TILE);
  }
}

export default Snake;
