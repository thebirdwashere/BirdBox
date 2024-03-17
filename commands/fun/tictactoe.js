const TicTacToe = require("../../gamecord/TicTacToe");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("play tic tac toe")
    .addUserOption((option) =>
      option.setName("user").setDescription("the opponent").setRequired(true)
    ),

  async execute ( interaction ) {
      const Game = new TicTacToe({
          message: interaction, 
          isSlashGame: true,
          opponent: interaction.options.getUser('user'),
          embed: {
              title: 'tictactoe',
              color: '#575757',
              statusTitle: 'Game Status:',
              overTitle: 'Game Finished!'
          },
          emojis: {
              xButton: '❌',
              oButton: '⭕',
              blankButton: '➖'
          },
          mentionUser: true,
          timeoutTime: 6000,
          xButtonStyle: ' ',
          oButtonStyle: ' ',
          turnMessage: '{emoji} | yo **{player}** its your turn',
          winMessage: '{emoji} | ggs **{player}**',
          tieMessage: 'tie',
          timeoutMessage: 'game abandoned smh',
          playerOnlyMessage: 'only {player} and {opponent} can use these buttons'
      })
      
      Game.startGame();
      Game.on('gameover', result => {
          console.log(result);
      })

  }
};

