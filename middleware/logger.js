const moment = require('moment');

const logger = function (req, res, next) {
    console.log(`\n${moment().format()}`);
    next();
}

module.exports = logger;