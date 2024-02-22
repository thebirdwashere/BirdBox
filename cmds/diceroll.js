const { randomIntInRange, sleepMs } = require("../utils")

module.exports = {
  name: 'diceroll',
  description: 'command to roll a die and get a random result (with some fun birdbox twists)',
  execute(message, args){
    //get the number of faces and return if invalid
    const numberOfFaces = getNumberOfFaces(message, args)
    if (!numberOfFaces) {return;}

    [mainNum, otherNum] = getRandomValues(numberOfFaces)

    const trolls = [
      "normal", "normal",  "normal",
      "offtable",
      "dogatemydie",
      "badmath",
      "intenseshaking"
    ]

    const trollSelection = trolls[randomIntInRange(1, trolls.length - 1)];
    switch (trollSelection) {
      case "normal": message.tryreply(`:game_die: You rolled ${mainNum}!`); break;
      case "offtable": message.tryreply(`:game_die: The die fell off the table! It landed on ${mainNum} though, if you think it counts.`); break;
      case "dogatemydie": message.tryreply(`:game_die: A dog just ate the die before I got a good look at it! I think it was ${mainNum}, though... or maybe ${otherNum}...`); break;
      case "badmath": badMathTroll(message, mainNum, otherNum); break;
      case "intenseshaking": intenseShakingTroll(message, mainNum); break;
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

function getRandomValues(numberOfFaces) {
  //calculate random roll
  const mainResult = randomIntInRange(1, numberOfFaces);

  //secondary result is needed for some trolls
  let secondaryResult = randomIntInRange(1, numberOfFaces);
  while (secondaryResult == mainResult) { //ensure this is different from main
    secondaryResult = randomIntInRange(1, numberOfFaces);}
  
  return [mainResult, secondaryResult]
}

async function badMathTroll(message, mainResult, secondaryResult) {
  message.tryreply(`:game_die: You rolled ${mainResult}!`);

  await sleepMs(randomIntInRange(2000, 8000)); //between two and eight seconds
  message.tryreply(`:game_die: Wait no, that's ${secondaryResult}. Not too good with numbers.`);
}

async function intenseShakingTroll(message, mainResult) {
  await message.reply(`:game_die: Hold on, let me shake them first.`)
  .finally(() => message.channel.sendTyping()); //make birdbox show as typing

  //some funny commentary
  randomSayings = [
    "*shaking noises*",
    "*shaking continues*",
    "*intense shaking*",
    "*still shaking*",
    "*how long will this shaking last*"
  ]

  //iterate an unpredictable number of times
  const MIN_ITERATIONS = 2
  const MAX_ITERATIONS = 7
  iterations = randomIntInRange(MIN_ITERATIONS, MAX_ITERATIONS)
  
  for (let i = 0; i < iterations; i++) {
    await sleepMs(randomIntInRange(2000, 8000)); //between two and eight seconds

    //send a random saying
    chosenSaying = randomSayings[randomIntInRange(1, randomSayings.length - 1)];
    await message.channel.send(chosenSaying)
    .finally(() => message.channel.sendTyping());  //make birdbox show as typing
  }

  //one last sleep
  await sleepMs(randomIntInRange(2000, 10000)); //between two and eight seconds

  //finally tell them what the result is
  message.tryreply(`:game_die: You rolled ${mainResult}!`);
}