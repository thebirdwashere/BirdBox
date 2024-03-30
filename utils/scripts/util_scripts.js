const responses = require('../../utils/json/responses.json');
const footers = require('../../utils/json/footers.json');
const defaults = require('../../utils/json/defaults.json');

module.exports = {
    randomFooters: (type) => {
        switch (type) {
            case 'snipe':
                return footers.snipe[Math.floor(Math.random() * footers.snipe.length)];
                break;
            case 'ball':
                return footers.ball[Math.floor(Math.random() * footers.ball.length)];
                break;
            default:
                // Put code here for default footers to use across functions
                break;
        }
    },
    randomMsg: (type) => {
        switch (type) {
            case 'rps':
                return responses.rps[Math.floor(Math.random() * responses.rps.length)];
                break;
            case 'ball':
                return responses.ball[Math.floor(Math.random() * responses.ball.length)];
                break;
        }
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    getSettingValue: async (setting, db) => {
        const dbSetting = await db.get(setting)
        const settingValue = dbSetting ?? defaults[setting]

        const specialReturns = {enable: true, disable: false}

        return specialReturns[settingValue] ?? settingValue
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
    }
}