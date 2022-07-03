const express = require('express');
const router = express.Router();
const { Foods, UserHistory } = require('../../models/foods-model');
const recommend = require('../../recommend');

//const { WebhookClient } = require('dialogflow-fulfillment');

function getContextPrefix(outputContexts) {
    if (outputContexts.length > 0) {
        return outputContexts[0].name.split('/').slice(0, -1).join('/');
    }
    return '';
}

const fulfillmentMessages = {
    "fulfillmentMessages": [
        {
            "text": {
                "text": [
                    "Default webhook response"
                ]
            }
        }
    ],
    "outputContexts": []
}

router.post('/', function (req, res) {
    // const agent = new WebhookClient({
    //     request: req,
    //     response: res
    // });

    // let intentMap = new Map();

    // intentMap.set('Recommend - condition - yes', (agent) => {
    //     return new Promise((resolve, reject) => {
    //         Foods.findOne({ 'tag.ingredient': agent.parameters.condition }).lean().exec((err, found) => {
    //             if (!found)
    //                 resolve('ไม่มีอาหารที่มีคุณลักษณะนี้ในระบบ');
    //             else {
    //                 Foods.find({ 'tag.ingredient': agent.parameters.condition }).lean().exec((err, selectedFoods) => {
    //                     try {
    //                         var random = Math.floor(Math.random() * selectedFoods.length);
    //                         const food = selectedFoods[random];
    //                         resolve(`${food.name}`);
    //                     }
    //                     catch (err) {
    //                         reject(err);
    //                     }
    //                 });
    //             }
    //         })
    //     })
    //         .then((msg) => {
    //             agent.setContext({ name: 'response', lifespan: 1, parameters: { food: msg } });
    //         })
    //         .catch(err => {
    //             console.log(err);
    //         });
    // });


    // intentMap.set('Recommend - no condition', (agent) => {
    //     return new Promise((resolve, reject) => {
    //         Foods.find().lean().exec((err, foods) => {
    //             try {
    //                 var random = Math.floor(Math.random() * foods.length);
    //                 const food = foods[random];
    //                 console.log(`randomized food: ${food.name}`);
    //                 resolve(`${food.name}`);
    //             }
    //             catch (err) {
    //                 reject(err);
    //             }
    //         });
    //     })
    //         .then((msg) => {
    //             agent.setContext({ name: 'response', lifespan: 1, parameters: { food: msg } });
    //         })
    //         .catch(err => {
    //             console.log(err);
    //         });
    // });

    // intentMap.set('Recommend - accepted', (agent) => {
    //     const history = new userHistory({
    //         user_id: agent.originalRequest.payload.data.user.id,
    //         food: agent.getContext('response').parameters.food,
    //         date: Date.now(),
    //         accepted: true
    //     });

    //     history.save((err, saved) => {
    //         if (err)
    //             console.log(err);
    //         else
    //             console.log(`user history saved: ${saved}`);
    //     });
    // });

    // agent.handleRequest(intentMap);

    const intent = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;

    if (intent === 'Recommend - condition - yes') {
        return new Promise((resolve, reject) => {
            Foods.findOne({ 'tag.ingredient': parameters.condition }).lean().exec((err, found) => {
                if (!found)
                    resolve('ไม่มีอาหารที่มีคุณลักษณะนี้ในระบบ');
                else {
                    Foods.find({ 'tag.ingredient': parameters.condition }).lean().exec((err, selectedFoods) => {
                        if (err)
                            reject(err);
                        else {
                            resolve(recommend.randomRecommend(selectedFoods));
                        }
                    });
                }
            })
        })
            .then((msg) => {
                const contextPrefix = getContextPrefix(req.body.queryResult.outputContexts);
                let newResponse = fulfillmentMessages;
                newResponse.fulfillmentMessages[0].text.text[0] = `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`;
                newResponse.outputContexts = req.body.queryResult.outputContexts;
                newResponse.outputContexts.push({
                    name: `${contextPrefix}/response`,
                    lifespanCount: 2,
                    parameters: { food: msg }
                });
                res.send(newResponse);
            })
            .catch(err => {
                console.log(err);
            });
    }

    else if (intent === 'Recommend - no condition') {
        return new Promise((resolve, reject) => {
            Foods.find().lean().exec((err, foods) => {
                try {
                    let user_id = req.body.originalDetectIntentRequest.payload.data.source.userId;
                    let userHistory = UserHistory.find({ user_id: user_id }).lean();
                    let userHistoryLength = userHistory.length | 0;
                    if (userHistoryLength <= 10)
                        resolve(recommend.randomRecommend(foods));
                    else if (userHistoryLength <= 50)
                        resolve(recommend.biasRandomRecommend(foods, userHistory));
                }
                catch (err) {
                    reject(err);
                    res.sendStatus(500);
                }
            });
        })
            .then((msg) => {
                const contextPrefix = getContextPrefix(req.body.queryResult.outputContexts);
                let newResponse = fulfillmentMessages;
                newResponse.fulfillmentMessages[0].text.text[0] = `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`;
                newResponse.outputContexts = req.body.queryResult.outputContexts;
                newResponse.outputContexts.push({
                    name: `${contextPrefix}/response`,
                    lifespanCount: 2,
                    parameters: { food: msg }
                });
                res.send(newResponse);
            })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    }

    else if (intent === 'Recommend - accepted') {
        var user_id = 'testID';
        try {
            user_id = req.body.originalDetectIntentRequest.payload.data.source.userId;
        }
        catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
        const lastSuggestion = req.body.queryResult.outputContexts.find(context => context.name.includes('/response')).parameters.food;
        console.log(`last suggestion: ${lastSuggestion}`);
        Foods.findOne({ name: lastSuggestion }).exec((err, found) => {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            }
            else {
                console.log(`found: ${found.name}`);
                try {
                    const history = new UserHistory({
                        user_id: user_id,
                        food: found,
                        date: Date.now(),
                    });

                    if (lastSuggestion) {
                        history.save((err, saved) => {
                            if (err)
                                console.log(err);
                            else {
                                console.log(`user history saved: ${saved}`);
                                res.send(saved);
                            }
                        });
                    }
                }
                catch (err) {
                    console.log(err);
                    res.sendStatus(500);
                }
            }
        });

        // try {
        //     const history = new UserHistory({
        //         user_id: req.body.originalDetectIntentRequest.payload.data.user.id,
        //         food: foodID,
        //         date: Date.now(),
        //         accepted: true
        //     });

        //     if (lastSuggestion) {
        //         history.save((err, saved) => {
        //             if (err)
        //                 console.log(err);
        //             else
        //                 console.log(`user history saved: ${saved}`);
        //         });
        //     }
        //     lastSuggestion = '';
        // }
        // catch (err) {
        //     console.log(err);
        // }
    }
});

module.exports = router;