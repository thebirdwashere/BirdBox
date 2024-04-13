const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'info',
    description: `Learn about the bot's latest updates. Info all to see even more!`,
    execute({message, args}, {prefix}) {
        //I M P O R T A N T
        //If you are modifying this in the future,
        //HERE IS THE PART YOU NEED
        //vvvvvvvvvvvvvvvvvv

        const patchnotes = [{
            version: `5.1.1`, date: `4/12/2024`, devs: `AgentNebulator`, contribs: `TheBirdWasHere`,
            notes: [
                `BirdBox no longer responds to messages sent by any bot`,
                `Fixed pin permissions not working in threads`,
                `Added embed to ${prefix}announce`
            ]
        }, {
            version: `5.1.0`, date: `3/24/2024`, devs: `AgentNebulator, Umadkek`,
            notes: [
                `Added new serverside config options for response types and pin command`,
                `Added claim, edit, and delete buttons to ${prefix}maybepile view`,
                `Added claim system to maybepile to establish development status`,
                `${prefix}coinflip now has a small change to land on the edge`,
                `${prefix}maybepile item selector no longer disables after one use`,
                `Alphabetical order response now changes if all words are the same`,
                `Added randomChoice utils function for choosing a random array element`,
                `Most commands now reply to command use`,
                `Added 15 new 8ball responses`
            ]
        }, {
            version: `5.0.1`, date: `3/12/2024`, devs: `AgentNebulator, Bislij, Umadkek`,
            notes: [
                `${prefix}8ball, ${prefix}ping, ${prefix}rr, and ${prefix}translate now use an embed`,
                `Added help description for diceroll & updated others`,
                `Rewrote help command to import from command info`,
                `Ported remaining modernmode functions to their respective files`,
                `Renamed modernmode file to be more descriptive about its function`,
                `Fixed issue with both canary and main responding to messages`,
                `Fixed crashes due to missing message send perms`,
                `Fixed typo in 8ball response`
            ]
        }, {
            version: `5.0.0`, date: `3/1/2024`, devs: `AgentNebulator, Bislij`,
            notes: [
                `Added ${prefix}coinflip and ${prefix}diceroll commands`,
                `Added ${prefix}setstatus to change bot status`,
                `Added snipe image support for cached images`,
                `Added privacy policy and ${prefix}privacy command`,
                `Added utils file for utility functions`,
                `Changed dev storage to use a JSON file`,
                `Changed the way arguments are passed to commands`,
                `Changed pin/unpin so devs can pin in any channel`,
                `Fixed message saying "added" when editing responses`,
                `Actually actually deleted db-test and noreply`
            ]
        }, {
            version: `4.3.4`, date: `2/13/2024`, devs: `AgentNebulator`,
            notes: [
                `User config can no longer be changed by any user during modification`,
                `${prefix}config now defaults to user as the initial mode`,
                `Fixed occasional misspellings in periodic table notifications`,
                `Fixed inconsistent placement of lyric responses`
            ]
        }, {
            version: `4.3.3`, date: `1/25/2023`, devs: `AgentNebulator`, contribs: `Crisby, TheBirdWasHere`,
            notes: [
                `${prefix}maybepile, ${prefix}responses, ${prefix}help, and ${prefix}config now use modals/buttons`,
                `Added a new config setting, Birdbox Classic, to use old text interfaces`,
                `Added ${prefix}settings as an alternative name for ${prefix}config`,
                `${prefix}config no longer shows server settings unless requested`,
                `Reordered message detection with respect to canary status`,
                `Merged noreply into echo as the inital argument`,
                `Reduced the time window for jinx detection`,
                `Plus a bunch of fixes nobody actually cares about`
                //here are the aforementioned fixes:
                
                /*`Certain error messages no longer say undefined when no input is provided`,
                `Fixed a crash when attempting to send something in a restricted channel`,
                `Fixed some instances where periodic table detection would fail`,
                `Fixed issue where non-dev users can delete responses`,
                `Fixed a typo in ${prefix}help regarding ${prefix}info`,
                `Fixed a typo in ${prefix}config`,
                `Actually removed ${prefix}db-test this time`*/
            ]
        }, {
            version: `4.3.2`, date: `1/8/2024`, devs: `AgentNebulator`, contribs: `Crisby, Anpun`,
            notes: [
                `Added jinx detector for two people saying the same thing at a similar time`,
                `Added element detector for messages made of periodic table abbreviations`,
                `Added a log system for detected messages to put them in their own channel`,
                `Added ${prefix}config command to configure user and server settings`,
                `Added 8ball emoji to the beginning of ${prefix}8ball responses`,
                `Added randomized footer text to ${prefix}snipe responses`,
                `${prefix}info now takes "all" after the command to see past patches`,
                `Snipes are now opt-in rather than being required (use ${prefix}config)`,
                `Moved message-parsing functions out of main.js and into their own file`,
                `Removed useless variable declaration from translate help`,
                `Removed useless function call from ${prefix}maybepile`,
                `Trimmed unnecessary data that was being stored by snipes`,
                `Fixed bugged error message when a response keyword is already in use`,
                `Fixed several edge cases with alphabetical detection, including emojis`,
                `Fixed a crash when snipes are missing data`
            ]
        }, {
            version: `4.3.1`, date: `1/1/2024`, devs: `AgentNebulator`, 
            notes: [
                `Fixed bug where maybepile edits would call the title a desc or author`,
                `Fixed bug where response additions would detect all keywords as duplicates`,
                `Removed leftover code from ${prefix}maybepile in ${prefix}responses`,
                `Added more descriptive error messages to ${prefix}responses`,
                `Fixed old ${prefix}info notes having spaces in command names`,
                `Fixed undefined in patch notes when contribs is empty`
            ]
        },
        {
            version: `4.3.0`, date: `12/25/2023`, devs: `AgentNebulator`, contribs: `Crisby, TheBirdWasHere`,
            notes: [
                `Added dates to ${prefix}info patch notes`,
                `Added 15 ${prefix}8ball messages, bringing the total to 100`,
                `Made maybepile embeds inline for cleaner display`,
                `Fixed ${prefix}maybepile breaking if item count is over 25`,
                `Replaced all instances of string concatenation with template literals`,
                `Removed ${prefix}db-test because it was useless`,
                `Added ${prefix}responses to manage stickers and lyrics`,
                `Added lyric response functionality`,
                `Removed hardcoded sticker responses`,
                `Updated ${prefix}help to reflect these changes`
            ]
        }, {
            version: `4.2.2`, date: `11/30/2023`, devs: `AgentNebulator`,
            notes: [
                `Reworked ${prefix}info internally to allow for multiple patches`,
                `Fixed ${prefix}maybepile bug where page numbers would not work if "view" is assumed`,
                'Leading spaces are no longer included in maybepile titles if created using the inital command',
                `${prefix}help maybepile now accurately reflects these changes`
            ]
        }, {
            version: `4.2.1`, date: `11/24/2023`, devs: `AgentNebulator`,
            notes: [
                `Added ${prefix}info to display bot info, version, and patch notes`,
                `${prefix}help is now reformatted to be shorter and easier to read`,
                `${prefix}help can now take arguments for certain command-specific pages`,
                `Rewrote ${prefix}maybepile to be modifiable with Discord commands`,
                `Reworked translation codes directory so pages are alphabetized`,
                `Translation codes are now found under ${prefix}help translate (page) and ${prefix}translate codes (page)`,
                `Added array of dev user ids, to be passed to commands like ${prefix}maybepile for perm checks`,
                `${prefix}command name are once again case-sensitive (this fixes bugs with echo-based commands)`,
                `Fixed bug where pinning a pinned message would return sucessful (and likewise with unpinning)`,
                `Updated bot credits to be more accurate`
            ]
        }]

        let devs = patchnotes[0].devs
        let versioncontribs
        if (patchnotes[0].contribs) {versioncontribs = `with help from ${patchnotes[0].contribs}`} else {versioncontribs = " "}
        let version = patchnotes[0].version

        let canary = true;
        if(prefix == `e;`) {canary = false};
        if (canary) {version = `${version} (Canary)`};

        const newEmbed = new EmbedBuilder()
        .setColor('#cbe1ec')
        .setTitle(`Version: ${version}`)
        .addFields({name: `Update by ${devs}`, value: `${versioncontribs}`})
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
        .setFooter({text: 'pretty regularly under development, maybe check back soon'})
        
        if (args[0] == "all") { //all notes in the command
            patchnotes.forEach((patch) => {
                let patchnotesString = ``
                patch.notes.forEach((item) => {
                    patchnotesString = `${patchnotesString}\n ● ${item}`
                })
                newEmbed.addFields({name: `${patch.version} Patch Notes (${patch.date})`, value: patchnotesString})
            });
        } else { //only the most recent notes
            let patchnotesString = ``
            patchnotes[0].notes.forEach((item) => {
                patchnotesString = `${patchnotesString}\n ● ${item}`
            })
            newEmbed.addFields({name: `${patchnotes[0].version} Patch Notes (${patchnotes[0].date})`, value: patchnotesString})
        }

        message.tryreply({embeds: [newEmbed]});
    }
}
