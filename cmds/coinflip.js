const { randomIntInRange } = require("../utils")

module.exports = {
    name: 'coinflip',
    description: 'its a coin flip my brother',
    execute(message){
    let responses = [
      'The coin landed on Heads!',
      'The coin landed on Tails!'
    ]

    const randomIndex = randomIntInRange(0, responses.length - 1)
    message.tryreply(":coin: " + responses[randomIndex]);
  }
}