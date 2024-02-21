const { randomIntInRange } = require("../utils")

module.exports = {
  name: 'diceroll',
  description: 'command to roll a die and get a random result',
  execute(message, args){

    const numberOfFaces = getNumberOfFaces(args[0])
    if (!numberOfFaces) {return;}

    const result = randomIntInRange(1, numberOfFaces);
    message.tryreply(`:game_die: You rolled ${result}!`);
  }
}

function getNumberOfFaces(providedNum) {
  let faces = Number(providedNum);

  if (faces < 1) {
    message.tryreply(`bro i kinda need a positive number of faces`);
    return null;
  } else if (faces !== Math.floor(faces)) {
    message.tryreply(`bro i kinda need an integer number of faces`);
    return null;
  } else if (!faces) {
    faces = 6;
  }

  return faces
}