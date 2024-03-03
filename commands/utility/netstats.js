const { SlashCommandBuilder } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('netstats')
		.setDescription('Runs ifconfig on the server that the bot is running off of.'),
    async execute(interaction) {

        exec("ifconfig enp5s0 | grep bytes", (error, stdout, stderr) => {

            if (error) {
                //console.log(`error: ${error.message}`);
                interaction.reply("Could not run netstats")
                return;
            }

            if (stderr) {
                interaction.reply(`There was an error: ${stderr}`)
                console.log(`stderr: ${stderr}`);
                return;
            }

            interaction.reply(`\`\`\`\n${stdout}\n\`\`\``);

        })

    }
}