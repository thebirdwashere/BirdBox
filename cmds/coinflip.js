module.exports = {
    name: 'coinflip',
    description: 'its a coin flip my brother',
    execute(message){
    let responses = [
      'The coin landed on Heads!',
      'The coin landed on Tails!'
    ]

    const randomIndex = Math.floor(Math.random() * responses.length);
    if (typeof responses[randomIndex] === "string") {
      message.tryreply(":coin: " + responses[randomIndex]);
    } else { //if you want rare response variants (like i did)
      const randomRandomIndex = Math.floor(Math.random() * responses[randomIndex].length);
      message.tryreply(":coin: " + responses[randomIndex][randomRandomIndex]);
    }
    
  }
}