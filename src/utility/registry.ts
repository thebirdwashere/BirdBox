import { Collection, REST, Routes } from "discord.js";
import { Command } from "./command.js";
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

    await rest.put(Routes.applicationCommands(id), {
      body: this.commands.map((command) => command.data),
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
}