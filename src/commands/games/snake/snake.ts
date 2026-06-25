import { Command } from "@src/utility/command.js";
import SnakePlay from "./play.js";

const SnakeCommand = new Command({
  name: "snake",
  description: "The classic snake game, playable (if only barely) on BirdBox!",
  subcommands: [
    SnakePlay,        // "play"
  ],
});

export default SnakeCommand;