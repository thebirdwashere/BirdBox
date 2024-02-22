const { randomIntInRange } = require("../utils")

module.exports = {
    name: 'coinflip',
    description: 'its a coin flip my brother',
    execute(message, args, vars){

    const providedOptions = getOptions(message, vars.prefix)
    const responses = createResponsesFromOptions(providedOptions)

    const randomIndex = randomIntInRange(0, responses.length - 1)
    message.tryreply(`:coin: Your result is "${responses[randomIndex]}"!`);
  }
}

function getOptions(message, prefix) {
  options = message.content            //example message: 'e;coinflip "do something" "do another thing"':
  .replace(`${prefix}coinflip`, '')    //'"do something" "do another thing"'
  .split('"').map(item => item.trim()) //'', 'do something', '', ' ', '', 'do another thing', ''
  .filter(item => item.trim() != '');  //'do something', 'do another thing'

  return options
}

function createResponsesFromOptions(options) {
  let responses
  const optionLength = options.length
  if (optionLength == 0) {
    responses = [
      'heads',
      'tails'
    ]
  } else if (optionLength == 1) {
    responses = [
      `${options[0]}`,
      `**not** ${options[0]}`
    ]
  } else {
    responses = [
      `${options[0]}`,
      `${options[1]}`
    ]
  }

  return responses
}