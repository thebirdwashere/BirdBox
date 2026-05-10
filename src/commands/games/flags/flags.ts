import { Command } from "src/utility/command.js";
import flagsQuiz from "./quiz.js";
import flagsLeaderboard from "./leaderboard.js";
import flagsStats from "./stats.js";

const FlagsCommand = new Command({
  name: "flags",
  description: "Compete to guess a country's flag quickly.",
  subcommands: [
    flagsQuiz, // "quiz"
    flagsLeaderboard, // "board"
    flagsStats, // "stats"
  ],
});

export default FlagsCommand;