const Foods = require('../../models/foods-model');

const {
    dialogflow
} = require('actions-on-google');

const agent = dialogflow();
agent.requestSource = agent.ACTIONS_ON_GOOGLE;

agent.intent('Recommend - condition - yes', (conv, params) => {
    const condition = params.condition;

    return new Promise((resolve, reject) => {
        Foods.findOne({ 'tag.ingredient': condition }).lean().exec((err, found) => {
            if (!found)
                resolve('ไม่มีอาหารที่มีคุณลักษณะนี้ในระบบ');
            else {
                Foods.find({ 'tag.ingredient': condition }).lean().exec((err, selectedFoods) => {
                    try {
                        var random = Math.floor(Math.random() * selectedFoods.length);
                        const food = selectedFoods[random];
                        resolve(`กิน${food.name}กันเถอะ`);
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            }
        })
    })
        .then((msg) => {
            conv.ask(msg);
        })
        .catch(err => {
            console.log(err);
        });
});

agent.intent('Recommend - no condition', (conv) => {
    return new Promise((resolve, reject) => {
        Foods.find().lean().exec((err, foods) => {
            try {
                var random = Math.floor(Math.random() * foods.length);
                const food = foods[random];
                console.log(`randomized food: ${food.name}`);
                resolve(`กิน${food.name}กันเถอะ`);
            }
            catch (err) {
                reject(err);
            }
        });
    })
        .then((msg) => {
            conv.ask(msg);
        })
        .catch(err => {
            console.log(err);
        });
});

module.exports = agent;