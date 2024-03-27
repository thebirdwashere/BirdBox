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
        return dbSetting ?? defaults[setting]
    }
}