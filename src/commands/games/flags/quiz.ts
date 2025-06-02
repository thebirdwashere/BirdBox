import { Subcommand } from "src/utility/command.js";

const flagsQuiz = new Subcommand({
  name: "quiz",
  description: "flags quiz",
  execute: async (_) => {
    return;
  },
});

export default flagsQuiz;
