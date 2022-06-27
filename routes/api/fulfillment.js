const express = require('express');
const Foods = require('../../models/foods-model');
const router = express.Router();

const { WebhookClient } = require('dialogflow-fulfillment');

router.post('/', function (req, res) {
    const agent = new WebhookClient({
        request: req,
        response: res
    });

    let intentMap = new Map();

    intentMap.set('Recommend - condition - yes', (agent) => {
        return new Promise((resolve, reject) => {
            Foods.findOne({ 'tag.ingredient': agent.parameters.condition }).lean().exec((err, found) => {
                if (!found)
                    resolve('ไม่มีอาหารที่มีคุณลักษณะนี้ในระบบ');
                else {
                    Foods.find({ 'tag.ingredient': agent.parameters.condition }).lean().exec((err, selectedFoods) => {
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
                agent.add(msg);
            })
            .catch(err => {
                console.log(err);
            });
    });


    intentMap.set('Recommend - no condition', (agent) => {
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
                agent.add(msg);
            })
            .catch(err => {
                console.log(err);
            });
    });

    agent.handleRequest(intentMap);
});

module.exports = router;