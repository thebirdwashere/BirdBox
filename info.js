module.exports = {
    name: 'info',
    description: `gives info about the bot's version and latest update`,
    execute(message, args, vars) {
        const EmbedBuilder = vars.EmbedBuilder;
        const prefix = vars.prefix ;

        //I M P O R T A N T
        //If you are modifying this in the future,
        //HERE IS THE PART YOU NEED
        //vvvvvvvvvvvvvvvvvv

        const patchnotes = [{
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
        },
        {
            version: `4.2.2`, date: `11/30/2023`, devs: `AgentNebulator`,
            notes: [
                `Reworked ${prefix} info internally to allow for multiple patches`,
                `Fixed ${prefix} maybepile bug where page numbers would not work if "view" is assumed`,
                'Leading spaces are no longer included in maybepile titles if created using the inital command',
                `${prefix} help maybepile now accurately reflects these changes`
            ]
        }, {
            version: `4.2.1`, date: `11/24/2023`, devs: `AgentNebulator`,
            notes: [
                `Added ${prefix} info to display bot info, version, and patch notes`,
                `${prefix} help is now reformatted to be shorter and easier to read`,
                `${prefix} help can now take arguments for certain command-specific pages`,
                `Rewrote ${prefix} maybepile to be modifiable with Discord commands`,
                `Reworked translation codes directory so pages are alphabetized`,
                `Translation codes are now found under ${prefix} help translate (page) and ${prefix} translate codes (page)`,
                `Added array of dev user ids, to be passed to commands like ${prefix} maybepile for perm checks`,
                `${prefix} command name are once again case-sensitive (this fixes bugs with echo-based commands)`,
                `Fixed bug where pinning a pinned message would return sucessful (and likewise with unpinning)`,
                `Updated bot credits to be more accurate`
            ]
        }]

        /* PAST PATCH NOTES



        */

        let devs = patchnotes[0].devs
        let versioncontribs = patchnotes[0].contribs
        let version = patchnotes[0].version

        let canary = true;
        if(prefix == `e;`) {canary = false};
        if (canary) {version = `${version} (Canary)`};

        const newEmbed = new EmbedBuilder()
        .setColor('#cbe1ec')
        .setTitle(`Version: ${version}`)
        .addFields({name: `Update by ${devs}`, value: `with help from ${versioncontribs}`})
        .setAuthor({ name: 'BirdBox', iconURL: 'https://cdn.discordapp.com/avatars/803811104953466880/5bce4f0ba438015ec65f5b9cac11c8e3.webp'})
        .setFooter({text: 'pretty regularly under development, maybe check back soon'})

        patchnotes.forEach((patch) => {
            let patchnotesString = ``
            patch.notes.forEach((item) => {
                patchnotesString = `${patchnotesString}\n ● ${item}`
            })
            newEmbed.addFields({name: `${patch.version} Patch Notes (${patch.date})`, value: patchnotesString})
        });
        

        message.reply({embeds: [newEmbed]});
    }
}