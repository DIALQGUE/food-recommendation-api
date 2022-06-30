const express = require('express');
const { Foods, UserHistory } = require('../../models/foods-model');
const router = express.Router();

//const { WebhookClient } = require('dialogflow-fulfillment');

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
    "outputContexts":[]
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
                        try {
                            var random = Math.floor(Math.random() * selectedFoods.length);
                            const food = selectedFoods[random];
                            console.log(`randomized food: ${food.name}`);
                            resolve(`${food.name}`);
                        }
                        catch (err) {
                            reject(err);
                        }
                    });
                }
            })
        })
            .then((msg) => {
                lastSuggestion = msg;
                let newResponse = fulfillmentMessages;
                newResponse.fulfillmentMessages[0].text.text[0] = `เราขอแนะนำเมนู ${msg}`;
                newResponse.outputContexts = req.body.queryResult.outputContexts;
                newResponse.outputContexts.push({
                    name: 'response',
                    lifespan: 1,
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
                    var random = Math.floor(Math.random() * foods.length);
                    const food = foods[random];
                    console.log(`randomized food: ${food.name}`);
                    resolve(`${food.name}`);
                }
                catch (err) {
                    reject(err);
                }
            });
        })
            .then((msg) => {
                lastSuggestion = msg;
                let newResponse = fulfillmentMessages;
                newResponse.fulfillmentMessages[0].text.text[0] = `เราขอแนะนำเมนู ${msg}`;
                newResponse.outputContexts = req.body.queryResult.outputContexts;
                newResponse.outputContexts.push({
                    name: 'response',
                    lifespan: 1,
                    parameters: { food: msg }
                });
                res.send(newResponse);
            })
            .catch(err => {
                console.log(err);
            });
    }

    else if (intent === 'Recommend - accepted') {
        const lastSuggestion = res.body.outputContexts[{"name" : "response"}].parameters.food;
        Foods.findOne({ name: lastSuggestion}).exec((err, found) => {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            }
            else {
                console.log(`found: ${found}`);
                try {
                    const history = new UserHistory({
                        user_id: req.body.originalDetectIntentRequest.payload.data.user.id,
                        food: found,
                        date: Date.now(),
                        accepted: true
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
                    lastSuggestion = '';
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