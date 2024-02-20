const { randomIntInRange } = require("../utils")

module.exports = {
  name: 'diceroll',
  description: 'diceroll, what else could it be?',
  execute(message){
    const result = randomIntInRange(1, 6)
    message.tryreply(`:game_die: You rolled a ${result}!`);
  }
}