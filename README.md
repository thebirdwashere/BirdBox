<h1 align="center">
  <img src=https://github.com/grumpzalt/BirdBox/assets/59405169/5e50b03c-e574-41f0-b5b1-4417e74d1e4e>
  <br>
  BirdBox
</h1>

**BirdBox** is a Discord Bot made using discord.js, mainly designed for personal use. However, it is fairly easy to self-host, and contains some features that may be useful to other servers.

The original project was created in late January 2021, originally using Zapier and BotGhost, was rewritten in November 2021 using discord.js, and then again in 2026 to use Typescript. We've decided to open source the bot, mainly to make it easier to collaborate. Hopefully you'll find it useful for inspiration or even functionality!

## Features

- Snipe support (opt-in, restores deleted messages in forums/channels)
- Translate command (translate between languages using Google Translate)
- 8ball command (never gives good answers, for fun only, good for having a conversation with the bot)
- Quotes command (stores a customizable record of quotes in your server to recall later)
- Games such as Rock-Paper-Scissors, Tic-Tac-Toe, Wordle, and guessing country flags
- Random interjections (unique based on message content; customizable by modifying source code)
- Ability to display neofetch of server bot is running on (requires extra setup)
- More to come later on!

## Setup

To set up BirdBox you will need

- Discord.js (currently using v14)
- TypeScript (v5.8.3 should work fine)
- Node.js (v22 or higher for database support)
- fast-glob (for extensible command system)
- dotenv (for .env file used for token)
- child_process (for neofetch command)
- google-translate-api (for translate command)

All packages in the above are available using NPM.

BirdBox will run on pretty much any Linux system (I have used both Arch Linux and Ubuntu Server). Other operating systems may work with some testing (Windows has been confirmed to work by fellow developers with some tweaking)

To download BirdBox, download the latest release from the Releases section; this will get you the latest tested and complete version. You can also clone the repository, but this will provide the latest potentially unstable/in development version.

Install instructions might be coming at a later date, but you pretty much just need to install those packages, add your token to the .env file, and run `npm run start`. If you want to run the bot using JavaScript instead of Typescript, run `npm run build` or `tsc` in the root directory (where this README is) to compile; a JavaScript version of the bot should become available in the `dist` directory and can be run with Node.

**Configuration**

To set up your bot, create a `.env` file in the root directory and format it like this:
```env
BOT_TOKEN=yourtokenhere
BOT_ID=youridhere
BOT_PREFIX="e;"
```
Replace "yourtokenhere" with the token you got from the Discord Developer Portal for your bot account, "youridhere" with your bot's ID, and e; with your preferred command prefix. Details for how to set up a bot account and how to acquire user IDs can be found online.

Several features of BirdBox are configurable in the `config` command, including your user and server preferences on interjections, as well as bot-global settings including the bot's status. If you want to be considered a developer to access bot-global settings and gain elevated permissions across commands, add your User ID and name to the json under `src/data/perms.json`.

Note: If you are creating a version of BirdBox for development/contribution purposes, you are legally obligated to change its profile picture to an image of Foof (the depicted rabbit) if at all possible. Other rabbits may be substituted, particularly if they are also owned by Bird, or another in-joke from the development team's members can suffice.

**Initial Use**

If you followed all the other steps correctly, your bot should now be online and operational! We hope you enjoy your BirdBox experience.

Some commands require additions to the sqlite database. These should support an empty one without breaking, but commands like `e;quotes`, `e;maybepile`, and `e;scratchpad` will require some setup. The image command requires an API key from [thecatapi.com](https://www.thecatapi.com) and [thedogapi.com](https://www.thedogapi.com/en/students), added to the `.env` file as "CAT_API_KEY" and "DOG_API_KEY" respectively. For the neofetch command to work, you will need to have neofetch installed on your system. Other commands, interjections, and features should work out of the box.

## Contribution

We could always use an extra set of hands, so if you want to become a BirdBox contributor, here are a few pointers.

**Commands**

BirdBox uses a custom system (originally developed by Bislij) to unify Discord's modern slash commands system (e.g. `/ping`) with the prefixed command system of old (`e;ping`). Adding a command is as easy as adding a file to `src/commands` which exports a Command object. The code in the `execute` function is run when the command is detected, and responses can be made using the `ctx` parameter of that function. Other properties like options, subcommands, permission requirements, or cooldowns can be added via optional parameters in the Command object.

**Database**

The database system (originally developed by AgentNebulator) stores data per user, channel, server, or globally. Use `ctx.db` to access the database, on which a variety of methods are provided for different use cases. We recommend not using the database on your first command if it can be avoided, but it is quite powerful for more advanced features.

Example code:
```typescript
ctx.db.user.update(ctx.user.id, "favoriteColor", "red")
ctx.db.user.fetchOrUndefined(ctx.user.id, "favoriteColor") //"red"
```

**Interjections**

These are how we refer to BirdBox jumping into a conversation every so often to provide random commentary or special responses. These are made by adding a file to `src/interjections` containing an Interjection object, which should have a name and a `test` function. If a message is detected that isn't from a bot, each interjection test is run and appropriate responses are carried out. Several of our current interjections can also be modified by changing the selection of messages they pull from, such as `keywords.json`, `lyrics.json`, and `interruptions.json`.

**General Advice**

Like many things in programming, your best resource is CTRL+C CTRL+V. Look around our current codebase and see how we implement certain features, then use that as a basis for your own creations. Discord.js also has great documentation and tutorials on [their website](https://discord.js.org/docs/packages/discord.js/14.26.4), which should come in handy for certain features. If you get stuck, feel free to ask a developer how they would handle something!

---

That's everything there is to know about BirdBox. Remember to have fun and love others (but only if it's eternal love)!

-The BirdBox Team

