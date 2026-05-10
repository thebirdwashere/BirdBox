import { Command } from "src/utility/command.js";
import FlagsQuiz from "./quiz.js";
import FlagsLeaderboard from "./leaderboard.js";
import FlagsStats from "./stats.js";

const FlagsCommand = new Command({
  name: "flags",
  description: "Compete to guess a country's flag quickly.",
  subcommands: [
    FlagsQuiz, // "quiz"
    FlagsLeaderboard, // "board"
    FlagsStats, // "stats"
  ],
});

export default FlagsCommand;