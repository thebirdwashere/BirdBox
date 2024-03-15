module.exports = {
    //Generate a random integer between a provided min and max value (inclusive both ends)
    randomIntInRange: (min, max) => {
        DEFAULT_MIN = 0

        if (typeof max === undefined) {
            //one argument is just the max
            max = min;
            min = DEFAULT_MIN;
        }

        max = max + 1; //ensures inclusivity
        
        //generate random stuff
        randomInteger = Math.floor(Math.random() * (max - min) + min);
        return randomInteger;
    },
    //Pick a random item from a provided array
    randomChoice: (array) => {
        randomInteger = Math.floor(Math.random() * array.length);
        randomChoice = array[randomInteger]

        return randomChoice
    },
    //Stop all processes for the designated time
    sleepMs: (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
}