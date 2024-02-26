const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'info',
    description: `gives info about the bot's version and latest update`,
    execute({message, args}, {prefix}) {
        //I M P O R T A N T
        //If you are modifying this in the future,
        //HERE IS THE PART YOU NEED
        //vvvvvvvvvvvvvvvvvv

        const patchnotes = [{
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
                `Fixed a typo in ${pre}help regarding ${pre}info`,
                `Fixed a typo in ${pre}config`,
                `Actually removed ${pre}db-test this time`*/
            ]
        }, {
            version: `4.3.2`, date: `1/08/2024`, devs: `AgentNebulator`, contribs: `Crisby, Anpun`,
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
        }]

        /* PAST PATCH NOTES

        {
            version: `4.2.2`, date: `11/30/2023`, devs: `AgentNebulator`,
            notes: [
                `Reworked ${pre}info internally to allow for multiple patches`,
                `Fixed ${pre}maybepile bug where page numbers would not work if "view" is assumed`,
                'Leading spaces are no longer included in maybepile titles if created using the inital command',
                `${pre}help maybepile now accurately reflects these changes`
            ]
        }, {
            version: `4.2.1`, date: `11/24/2023`, devs: `AgentNebulator`,
            notes: [
                `Added ${pre}info to display bot info, version, and patch notes`,
                `${pre}help is now reformatted to be shorter and easier to read`,
                `${pre}help can now take arguments for certain command-specific pages`,
                `Rewrote ${pre}maybepile to be modifiable with Discord commands`,
                `Reworked translation codes directory so pages are alphabetized`,
                `Translation codes are now found under ${pre}help translate (page) and ${pre}translate codes (page)`,
                `Added array of dev user ids, to be passed to commands like ${pre}maybepile for perm checks`,
                `${pre}command name are once again case-sensitive (this fixes bugs with echo-based commands)`,
                `Fixed bug where pinning a pinned message would return sucessful (and likewise with unpinning)`,
                `Updated bot credits to be more accurate`
            ]
        }

        */

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

        message.channel.trysend({embeds: [newEmbed]});
    }
}