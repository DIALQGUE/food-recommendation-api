const { Foods, UserHistory } = require('./models/foods-model');

var ingredient = [], taste = [], cuisine = [];

function retrieveTag() {

    Foods.distinct('tag.ingredient').lean().exec(function (err, ingredients) {
        if (err) throw err;
        ingredient = ingredients;
    });
    Foods.distinct('tag.taste').lean().exec(function (err, tastes) {
        if (err) throw err;
        taste = tastes;
    });
    Foods.distinct('tag.cuisine').lean().exec(function (err, cuisines) {
        if (err) throw err;
        cuisine = cuisines;
    });
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
    console.log("randomRecommend");
    var random = Math.floor(Math.random() * foods.length);
    return foods[random].name;
}

function biasRandomRecommend(foods, userHistory) {
    console.log("biasRandomRecommend");
    pastFoods = userHistory.map(record => record.food);
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