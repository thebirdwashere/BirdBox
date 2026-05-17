import { Command } from "@src/utility/command.js";
import QuotesAdd from "./add.js";
import QuotesRandom from "./random.js";
import QuotesGet from "./get.js";
import QuotesEdit from "./edit.js";
import QuotesDelete from "./delete.js";

const Quotes = new Command({
  name: "quotes",
  description: "Write down and recall quotes of your fellow members.",
  subcommands: [
    QuotesAdd,    // "add"
    QuotesRandom, // "random"
    QuotesGet,    // "get"
    QuotesEdit,   // "edit"
    QuotesDelete, // "delete"
  ],
});

export default Quotes;