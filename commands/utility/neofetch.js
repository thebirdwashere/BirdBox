const { SlashCommandBuilder } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('neofetch')
		.setDescription('Runs neofetch on the server that the bot is running off of.'),
    async execute(interaction) {

        exec("neofetch --stdout", (error, stdout, stderr) => {

            if (error) {
                //console.log(`error: ${error.message}`);
                interaction.reply("Could not run neofetch")
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