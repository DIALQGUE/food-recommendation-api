const { Foods, UserHistory } = require('./models/foods-model');

var ingredient, taste, cuisine;

function retrieveTag() {
    ingredient = Foods.find().distinct('tag.ingredient').lean();
    taste = Foods.find().distinct('tag.taste').lean();
    cuisine = Foods.find().distinct('tag.cuisine').lean();
    return;
}

function detectCondition(parameter) {
    const condition = parameter.condition;
    if (ingredient.includes(condition))
        return { "type": "ingredient", "condition": condition };
    if (cuisine.includes(condition))
        return { "type": "cuisine", "condition": condition };
    if (taste.includes(condition))
        return { "type": "taste", "condition": condition };
    else
        return { "type": "", "condition": condition };
}

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
    biasRandomRecommend,
    detectCondition,
    retrieveTag
};