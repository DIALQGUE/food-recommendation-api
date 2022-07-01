const { UserHistory } = require('./models/foods-model');

function randomRecommend(foods) {
    var random = Math.floor(Math.random() * foods.length);
    return foods[random].name;
}

function biasRandomRecommend(foods, userHistory) {
    pastFoods = userHistory.populate('food').map(record => record.food);
    biasFoods = foods.concat(pastFoods);
    var random = Math.floor(Math.random() * foods.length);
    return foods[random].name;
}

module.exports = {
    randomRecommend,
    biasRandomRecommend
};