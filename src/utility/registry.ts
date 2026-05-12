import { Collection, REST, Routes } from "discord.js";
import { Command, ContextMenuData, isSubcommandArray, Subcommand } from "./command.js";
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

  async detectCommands(source: string): Promise<void> {
    const globPattern = toPosixPath(path.join(source, "**/*.{js,ts}"));
    const fileGlob = await fg(globPattern);

    const files = [];
    for (const filePath of fileGlob)
      files.push(await import(pathToFileURL(filePath).href));

    const commands = files
      .map(({ default: command }) => {
        if (!(command instanceof Command)) return null;
        // command: Command
        return [command.data.name, command] as [string, Command];
      })
      .filter((item) => item !== null);

    this.commands = new Collection(commands);
  }

  async registerCommands(token: string, id: string): Promise<void> {
    const rest = new REST().setToken(token);

    //reigster ordinary commands
    await rest.put(Routes.applicationCommands(id), {
      body: this.commands.map((command) => command.data),
    });

    //reigster context menu commands
    const contextMenuCommands = this.commands
      .map(command => command.contextmenu)
      .filter(command => command !== undefined);
    
    const contextMenuSubcommands = Array.from(this.commands.values())
      .flatMap((command): (ContextMenuData | undefined)[] => {
        if (!command.body || !isSubcommandArray(command.body)) return [undefined];
        return command.body.map(subcommand => subcommand.contextmenu);
      })
      .filter(command => command !== undefined);
    
    const allContextMenuCommands = contextMenuCommands.concat(contextMenuSubcommands);

    await rest.put(Routes.applicationCommands(id), {
      body: allContextMenuCommands.map((command) => command.data),
    });
  }

  async detectInterjections(source: string): Promise<void> {
    const globPattern = toPosixPath(path.join(source, "*.{js,ts}"));
    const fileGlob = await fg(globPattern);

    const files = [];
    for (const filePath of fileGlob)
      files.push(await import(pathToFileURL(filePath).href));

    const interjections = files
      .map(({ default: interjection }) => {
        if (!(interjection instanceof Interjection)) return null;
        // interjection: Interjection
        return [interjection.name, interjection] as [string, Interjection];
      })
      .filter((item) => item !== null);

    this.interjections = new Collection(interjections);

    // console.log(this.interjections);
  }

  async testInterjections(ctx: MessageContext): Promise<void> {
    // const timesArray = new Collection();
    for (const interjection of this.interjections.values()) {
      try {
        // const startTime = performance.now();

        await interjection.test(ctx);

        // const endTime = performance.now();
        // timesArray.set(interjection.name, endTime - startTime);
      } catch (error: unknown) {
        await handleInterjectionError(
          ctx,
          interjection.name,
          error
        );
      };
    };

    // timesArray.sort().reverse();
    // for (const [key, val] of timesArray.entries()) {
    //   console.log(`${String(key)} time: ${String(val)}`);
    // }

    // console.log("---");
  }
}