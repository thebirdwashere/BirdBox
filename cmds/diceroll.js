const { randomIntInRange, sleepMs } = require("../utils")

module.exports = {
  name: 'diceroll',
  description: 'command to roll a die and get a random result (with some fun birdbox twists)',
  execute(message, args){
    //get the number of faces and return if invalid
    const numberOfFaces = getNumberOfFaces(message, args)
    if (!numberOfFaces) {return;}

    //calculate random roll
    const mainResult = randomIntInRange(1, numberOfFaces);

    const trolls = [
      "normal",
      "badmath"
    ]

    const trollSelection = trolls[randomIntInRange(1, trolls.length - 1)];
    if (trollSelection === "normal") {
      message.tryreply(`:game_die: You rolled ${mainResult}!`);
    } else if (trollSelection === "badmath") {
      badMathTroll(message, numberOfFaces, mainResult)
    }
  }
}

function getNumberOfFaces(message, args) {
  let faces = Number(args[0]);

  if (faces < 1) {
    message.tryreply(`bro i kinda need a positive number of faces`);
    return null;
  } else if (!faces) {
    faces = 6;
  } else if (faces != Math.floor(faces)) {
    message.tryreply(`bro i kinda need an integer number of faces`);
    return null;
  }

  return faces
}

async function badMathTroll(message, facesNum, mainResult) {
  message.tryreply(`:game_die: You rolled ${mainResult}!`);

  let correctedResult = randomIntInRange(1, facesNum);
  while (correctedResult == mainResult) {
    correctedResult = randomIntInRange(1, facesNum);
  }

  await sleepMs(randomIntInRange(2000, 6000))
  message.tryreply(`:game_die: Wait no, that's ${correctedResult}. Not too good with numbers.`);
}