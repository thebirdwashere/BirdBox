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

    //secondary result is needed for some trolls
    const secondaryResult = randomIntInRange(1, numberOfFaces);
    while (secondaryResult == mainResult) { //ensure this is different from main
      secondaryResult = randomIntInRange(1, numberOfFaces);}

    const trolls = [
      "normal", "normal",
      "badmath",
      "offtable",
      "dogatemydie"
    ]

    const trollSelection = trolls[randomIntInRange(1, trolls.length - 1)];
    switch (trollSelection) {
      case "normal": message.tryreply(`:game_die: You rolled ${mainResult}!`); break;
      case "offtable": message.tryreply(`:game_die: The die fell off the table! It landed on ${mainResult} though, if you think it counts.`); break;
      case "dogatemydie": message.tryreply(`:game_die: A dog just ate the die before I got a good look at it! I think it was ${mainResult}, though... or maybe ${secondaryResult}...`); break;
      case "badmath": badMathTroll(message, mainResult, secondaryResult); break;
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

  return faces;
}

async function badMathTroll(message, mainResult, secondaryResult) {
  message.tryreply(`:game_die: You rolled ${mainResult}!`);

  await sleepMs(randomIntInRange(2000, 8000)); //between two and eight seconds
  message.tryreply(`:game_die: Wait no, that's ${secondaryResult}. Not too good with numbers.`);
}