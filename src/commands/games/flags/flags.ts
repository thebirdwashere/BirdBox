import { Command } from "src/utility/command.js";
import flagsQuiz from "./quiz.js";
import flagsBoard from "./board.js";
import flagsStats from "./stats.js";

const Flags = new Command({
  name: "flags",
  description: "flags game",
  subcommands: [
    flagsBoard, // "board"
    flagsQuiz, // "quiz"
    flagsStats, // "stats"
  ],
});

export default Flags;
