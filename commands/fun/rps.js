const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { rps } = require("../../utils/json/responses.json");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('rps')
		.setDescription('Play Rock, Paper, Scissors with the bot.')
        .addStringOption(option =>
			option
				.setName('move')
				.setDescription('Your move to play (r/p/s or rock/paper/scissors).')
                .setMaxLength(1024)
				.setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {

        const choices = [].concat(rps.map(item => item.names[0]));

        const focusedOption = interaction.options.getFocused(true);
        const value = focusedOption.value.charAt(0).toLowerCase() + focusedOption.value.slice(1)
        let filtered = choices.filter(choice => choice.startsWith(value));
        filtered = filtered.map(choice => ({ name: choice, value: choice }));
        filtered = filtered.slice(0, 25);

        await interaction.respond(filtered);

    },
    async execute(interaction, { embedColors }) {

        const validMoves = ([].concat(...rps.map(item => item.names)));
        const moveNames = [].concat(rps.map(item => item.names[0]));
        const emojis = rps.map(item => item.emoji);

        let playerMove = interaction.options.getString('move');
        let computerMove = moveNames[Math.floor(Math.random() * moveNames.length)];
        let result, footer, color;

        if(!validMoves.includes(playerMove)) return interaction.reply({ content: 'bruh it\'s literally the title of the game, you gotta use "rock", "paper", or "scissors".', ephemeral: true });

        const abbvMoves = Object.fromEntries([].concat(rps.map(item => item.names[1])).map((key, index) => [key, [].concat(rps.map(item => item.names[0]))[index]]));
        if(abbvMoves[playerMove]) playerMove = abbvMoves[playerMove];

        let playerMoveNum = moveNames.indexOf(playerMove);
        let computerMoveNum = moveNames.indexOf(computerMove);

        if (playerMoveNum == computerMoveNum) {result = 'You Tied!'; footer = 'kinda mid game ngl'; color = embedColors.yellow;}
		else if (((playerMoveNum - computerMoveNum) + 3) % 3 == 1) {result = 'You Won!'; footer = 'decent job chump'; color = embedColors.green;}
		else {result = 'You Lost!'; footer = 'massive L';  color = embedColors.red;}

        const rpsEmbed = new EmbedBuilder()
            .setTitle(result)
            .setColor(color)
            .addFields(
				{ name: 'You', value: `${emojis[playerMoveNum]}`, inline: true},
                { name: 'BirdBox', value: `${emojis[computerMoveNum]}`, inline: true}
			)
            .setFooter({ text: footer });

        await interaction.reply({ embeds: [rpsEmbed] });

    }
}
