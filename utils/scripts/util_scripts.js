const responses = require('../../utils/json/responses.json');
const footers = require('../../utils/json/footers.json');

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

        }
    },
    randomMsg: () => {
        return responses.ball[Math.floor(Math.random() * responses.ball.length)];
    }
}