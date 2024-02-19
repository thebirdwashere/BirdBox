module.exports = {
    name: 'diceroll',
    description: 'diceroll, what else could it be?',
    execute(message){
    let responses = [
      'The dice landed on 1!',
      'The dice landed on 2!',
      'The dice landed on 3!',
      'The dice landed on 4!',
      'The dice landed on 5!',
      'The dice landed on 6!'
    ]

    const randomIndex = Math.floor(Math.random() * responses.length);
    if (typeof responses[randomIndex] === "string") {
      message.tryreply(":game_die: " + responses[randomIndex]);
    } else { //if you want rare response variants (like i did)
      const randomRandomIndex = Math.floor(Math.random() * responses[randomIndex].length);
      message.tryreply(":game_die: " + responses[randomIndex][randomRandomIndex]);
    }
    
  }
}