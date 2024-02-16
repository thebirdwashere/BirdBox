<h1 align="center">
  <img src=https://github.com/grumpzalt/BirdBox/assets/59405169/5e50b03c-e574-41f0-b5b1-4417e74d1e4e>
  <br>
  BirdBox
</h1>

**BirdBox** is a Discord Bot made using discord.js, mainly designed for my own use in a server I am in, however is fairly easy to self-host, and contains some features useful outside of my servers.

BirdBox was created in late January 2021, originally using Zapier and BotGhost, and was rewritten in November 2021 using discord.js, and we have recently decided to open source the bot, mainly to make it easier to collaborate, as well as for anyone who may want to take inspiration from the bot, or would find it useful.


## Features

- Snipe support (opt-in, restores deleted messages in forums/channels)
- Pinning/unpinning messages for owners of forum threads/channels (For users who don't have permissions but want to pin messages in their channels)
- Translate command (translate between languages using Google Translate)
- Message responses (currently only modifiable by BirdBox Devs, replies with images or lyrics depending on message content)
- Echo command (both reply and non reply version)
- 8ball command (never gives good answers, for fun only, good for having a conversation with the bot)
- Rock Paper Scissors game (play with the bot)
- Ability to display neofetch of server bot is running on, as well as network usage stats (requires additional setup)
- More to come later on!

**Setup**

To set up BirdBox you will need

- Discord.js (currently using v14 on my server)
- Node.js (currently using v20.10.0 on my server)
- better-sqlite3 and quick.db (for snipe command as well as responses)
- dotenv (for .env file used for token)
- child_process (used for netstats and neofetch commands)
- google-translate-api (for translate command)
- bindings
All of these packages are available using NPM.

BirdBox will run on pretty much any Linux system (I have used both Arch Linux and Ubuntu Server), as for other operating systems you may or may not be able to get it working (I know Windows works with some tweaking according to one of my friends who uses Windows for developing the bot. not sure about MacOS but I'm sure it's the same)

Install instructions might be coming at a later date, but you pretty much just need to install those packages, add your token to the .env file, and run main.js.

To add your token, create a ".env" file in the root directory of the bot (where main.js is), and inside the file, put DISCORD_TOKEN="YOUR-TOKEN-HERE" in it, and replace YOUR-TOKEN-HERE with the token you got from the Discord Developer Portal for your bot account. Instructions for creating a bot account can be found online or on YouTube.

To download BirdBox, you can either clone this repository, or download the latest release from the Releases section, both contain the same files, as Releases is mainly being used to keep track of versions, but if you want an old version, go there.




