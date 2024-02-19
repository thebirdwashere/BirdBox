<h1 align="center">
  <img src=https://github.com/grumpzalt/BirdBox/assets/59405169/5e50b03c-e574-41f0-b5b1-4417e74d1e4e>
  <br>
  BirdBox
</h1>

**BirdBox** is a Discord Bot made using discord.js, mainly designed for my own use in a server I am in. However, it is fairly easy to self-host, and contains some features useful outside of my servers.

The original project was created in late January 2021, originally using Zapier and BotGhost, and was rewritten in November 2021 using discord.js. We've recently decided to open source the bot, mainly to make it easier to collaborate. Hopefully you'll find it useful for inspiration or even functionality!

## Features

- Snipe support (opt-in, restores deleted messages in forums/channels)
- Pinning/unpinning messages for owners of forum threads/channels (For users who don't have permissions but want to pin messages in their channels)
- Translate command (translate between languages using Google Translate)
- Message responses (currently only modifiable by BirdBox devs, replies with images or lyrics depending on message content)
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

BirdBox will run on pretty much any Linux system (I have used both Arch Linux and Ubuntu Server). Other operating systems may work with some testing (Windows has been confirmed to work by a fellow developer with some tweaking)

Install instructions might be coming at a later date, but you pretty much just need to install those packages, add your token to the .env file, and run main.js.

To add your token, create a ".env" file in the root directory of the bot (where main.js is), and inside the file, put DISCORD_TOKEN="YOUR-TOKEN-HERE" in it, and replace YOUR-TOKEN-HERE with the token you got from the Discord Developer Portal for your bot account. Instructions for creating a bot account can be found online or on YouTube.

To download BirdBox, download the latest release from the Releases section, this will get you the latest tested and complete version, you can also clone the repository, however this will get you the latest potentially unstable/in development version.

**Configuration**

To change BirdBox's status, edit line 61 of main.js (under client.user.setPresence) with your chosen status message.
You can also change ActivityType to Competing, Custom (the default), Listening, Playing, Streaming and Watching.

If you want to be considered a dev (for modifying the maybepile and responses), add your User ID to the array at the top of main.js. Details for how to acquire a User ID can be found online.

For the neofetch command to work, you will need to have neofetch installed on your system.

To make the netstats command work, you will need ifconfig installed (should be by default) and you will probably need to change the network interface BirdBox is checking.

To do so, go to the netstats.js file in the cmds file, and edit line 9 [begins with exec("ifconfig enp5s0 ] to show your actual network interface instead of the default "enp5s0" which is set for my server. To check network interfaces, type "ip a" into your terminal and look for something beginning with "enp" if using Ethernet or "wlp" if using WiFi. Take the name of the interface you found and use it to replace the default.

Other configuration changes can be made using the e;config command built into BirdBox.



