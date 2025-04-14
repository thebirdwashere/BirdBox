const responses = require('../../utils/json/responses.json');
const footers = require('../../utils/json/footers.json');
const defaults = require('../../utils/json/defaults.json');
const wordle = require('../../utils/json/wordle.json');

module.exports = {
    randomFooter: (type) => {
        switch (type) {
            case 'snipe':
                return footers.snipe[Math.floor(Math.random() * footers.snipe.length)];
            case 'ball':
                return footers.ball[Math.floor(Math.random() * footers.ball.length)];
            case 'quote':
                return footers.quote[Math.floor(Math.random() * footers.quote.length)];
            case 'help':
                return footers.help[Math.floor(Math.random() * footers.help.length)];
            default:
                // Put code here for default footers to use across functions
                break;
        }
    },
    randomMsg: (type) => {
        switch (type) {
            case 'rps':
                return responses.rps[Math.floor(Math.random() * responses.rps.length)];
            case 'ball':
                return responses.ball[Math.floor(Math.random() * responses.ball.length)];
            case 'wordle':
                return wordle.solutions[Math.floor(Math.random() * wordle.solutions.length)];
            case 'wordle all':
                return wordle.guesses[Math.floor(Math.random() * wordle.guesses.length)];
        }
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    getSettingValue: async (setting, db) => {
        const dbSetting = await db.get(setting);
        const settingValue = dbSetting ?? defaults[setting];

        const specialReturns = {enable: true, disable: false};

        return specialReturns[settingValue] ?? settingValue;
    },
    shuffleArray: (array) => {
        let originalArray = [...array]
        let shuffledArray = []

        while (originalArray.length) {
            const randomInt = Math.floor(Math.random() * originalArray.length)
            shuffledArray = shuffledArray.concat(originalArray.splice(randomInt, 1))
        }

        return shuffledArray
    },
    sampleArray: (array, sampleSize) => {
        let originalArray = [...array]
        let sampledArray = []

        while (sampledArray.length < sampleSize) {
            const randomInt = Math.floor(Math.random() * originalArray.length)
            sampledArray = sampledArray.concat(originalArray.splice(randomInt, 1))
        }

        return sampledArray
    },
    chunk: (arr, size) => {
        function* chunkSplit(arr, size) {
            for (let i = 0; i < arr.length; i += size) {
                yield arr.slice(i, i + size);
            }
        }

        return [...chunkSplit(arr, size)];
    },
    getPrefix: (client) => {
        const clientId = client.user.id;
        switch (clientId) {
            case "803811104953466880": return "e;";   //main birdbox
            case "911696357356617759": return "ec;";  //canary birdbox
            case "1009116059112063067": return "d;";  //canary squared devbot
            default: return "e;";                     //default case
        }
    }
}