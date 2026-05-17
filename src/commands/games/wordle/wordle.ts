import { Command } from "@src/utility/command.js";
import WordleStart from "./start.js";
import WordleGuess from "./guess.js";
import WordleStats from "./stats.js";
import WordleCode from "./code.js";
import WordleLeaderboard from "./leaderboard.js";

const WordleCommand = new Command({
  name: "wordle",
  description: "Play the iconic daily game anytime on BirdBox!",
  subcommands: [
    WordleStart,       // "start"
    WordleGuess,       // "guess"
    WordleCode,        // "code"
    WordleLeaderboard, //"leaderboard"
    WordleStats,       // "stats"
  ],
});

export default WordleCommand;