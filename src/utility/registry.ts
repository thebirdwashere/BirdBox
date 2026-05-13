import { Collection, ContextMenuCommandBuilder, REST, Routes, SlashCommandBuilder } from "discord.js";
import { Command, ContextMenuData, isSubcommandArray } from "./command.js";
import { toPosixPath } from "./utility.js";
import path from "path";
import fg from "fast-glob";
import { pathToFileURL } from "url";
import { Interjection } from "./interjection.js";
import { MessageContext } from "./context.js";
import { handleInterjectionError } from "./error.js";

export class Registry {
  commands: Collection<string, Command>;
  interjections: Collection<string, Interjection>;

  constructor() {
    this.commands = new Collection();
    this.interjections = new Collection();
  }

  async detectCommands(source: string, devMode: boolean): Promise<void> {
    const globPattern = toPosixPath(path.join(source, "**/*.{js,ts}"));
    const fileGlob = await fg(globPattern);

    const files = [];
    for (const filePath of fileGlob)
      files.push(await import(pathToFileURL(filePath).href));

    const commands = files
      .map(({ default: command }) => {
        if (!(command instanceof Command)) return null;
        // command: Command
        if (devMode) console.log(`- Detected command "${command.data.name}" with ${(command.body?.length ?? 0).toString()} arguments.`);
        return [command.data.name, command] as [string, Command];
      })
      .filter((item) => item !== null);

    this.commands = new Collection(commands);
  }

  async registerCommands(token: string, id: string): Promise<void> {
    const rest = new REST().setToken(token);

    //get ordinary commands
    const chatInputCommands = this.commands;

    //get regular context menu commands
    const contextMenuCommands = this.commands
      .mapValues(command => command.contextmenu)
      .filter(command => command !== undefined);
    
    //this is awful i'm so sorry to whoever has to edit this next, 
    //i'll try to comment well but there's no saving this gibberish

    //get context menu subcommands
    const contextMenuSubcommands: Collection<string, ContextMenuData> = new Collection<string, ContextMenuData>();

    //for each regular command...
    for (const command of this.commands.values()) {
      //if the command doesn't have subcommands, move on
      if (!command.body || !isSubcommandArray(command.body)) continue;

      //for each subcommand, if it has a context menu, add it to the list
      for (const subcommand of command.body) {
        if (subcommand.contextmenu) 
          contextMenuSubcommands.set(subcommand.contextmenu.label, subcommand.contextmenu);
      }
    }

    //merge everything together
    const allContextMenuCommands = contextMenuCommands.concat(contextMenuSubcommands);
    const allCommands: (SlashCommandBuilder | ContextMenuCommandBuilder)[] = new Array<SlashCommandBuilder | ContextMenuCommandBuilder>()
      .concat(chatInputCommands.map((command) => command.data))
      .concat(allContextMenuCommands.map((command) => command.data));

    //send it off
    await rest.put(Routes.applicationCommands(id), {
      body: allCommands,
    });
  }

  async detectInterjections(source: string, devMode: boolean): Promise<void> {
    const globPattern = toPosixPath(path.join(source, "*.{js,ts}"));
    const fileGlob = await fg(globPattern);

    const files = [];
    for (const filePath of fileGlob)
      files.push(await import(pathToFileURL(filePath).href));

    const interjections = files
      .map(({ default: interjection }) => {
        if (!(interjection instanceof Interjection)) return null;
        // interjection: Interjection
        if (devMode) console.log(`- Detected interjection "${interjection.name}".`);
        return [interjection.name, interjection] as [string, Interjection];
      })
      .filter((item) => item !== null);

    this.interjections = new Collection(interjections);

    // console.log(this.interjections);
  }

  async testInterjections(ctx: MessageContext): Promise<void> {
    for (const interjection of this.interjections.values()) {
      try {
        await interjection.test(ctx);
      } catch (error: unknown) {
        await handleInterjectionError(
          ctx,
          interjection.name,
          error
        );
      };
    };
  }

  async testAndBenchmarknterjections(ctx: MessageContext): Promise<void> {
    if (!ctx.data.devMode) 
      throw new Error("Benchmarking expects dev mode.");
    console.log("\nBeginning to benchmark interjections...");

    const timesArray = new Collection<string, number>();
    const overallStart = performance.now();
  
    for (const interjection of this.interjections.values()) {
      try {
        const startTime = performance.now();

        await interjection.test(ctx);

        const endTime = performance.now();
        timesArray.set(interjection.name, endTime - startTime);
      } catch (error: unknown) {
        await handleInterjectionError(
          ctx,
          interjection.name,
          error
        );
      };
    };

    const overallEnd = performance.now();
    const overallTime = overallEnd - overallStart;

    timesArray.sort().reverse();
    for (const [key, val] of timesArray.entries()) {
      console.log(`- ${String(key)} time: \x1b[33m${val.toPrecision(4)}ms\x1b[0m`);
    }
    console.log(`Overall: \x1b[33m${overallTime.toPrecision(4)}ms\x1b[0m`);
  }
}