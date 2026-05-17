import { Command } from "@src/utility/command.js";
import MaybepileView from "./view.js";
import MaybepileSuggest from "./suggest.js";
import MaybepileEdit from "./edit.js";
import MaybepileDelete from "./delete.js";
import MaybepileClaim from "./claim.js";

const MaybepileCommand = new Command({
  name: "maybepile",
  description: "A list of possible features.",
  subcommands: [
    MaybepileView,    // "view"
    MaybepileSuggest, // "suggest"
    MaybepileEdit,    // "edit"
    MaybepileDelete,  // "delete"
    MaybepileClaim,   // "claim"
  ],
});

export default MaybepileCommand;