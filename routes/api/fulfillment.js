const express = require('express');
const router = express.Router();
const { Foods, UserHistory } = require('../../models/foods-model');
const recommend = require('../../recommend');

function getContextPrefix(outputContexts) {
    if (outputContexts.length > 0) {
        return outputContexts[0].name.split('/').slice(0, -1).join('/');
    }
    return '';
}

const fulfillmentResponse = {
    "fulfillmentMessages": [
        {
            "text": {
                "text": []
            }
        }
    ],
    "outputContexts": []
}

router.post('/', function (req, res) {

    const intent = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;

    if (intent === 'Recommend - condition') {
        let success = false;
        return new Promise((resolve, reject) => {
            const condition = parameters.condition;
            let query = {
                $or: [
                    { name: { $regex: `.*${condition}.*` } },
                    { 'tag.ingredient': { $regex: `.*${condition}.*` } },
                    { 'tag.taste': { $regex: `.*${condition}.*` } },
                    { 'tag.cuisine': { $regex: `.*${condition}.*` } }
                ]
            };
            Foods.findOne(query).lean().exec((err, found) => {
                if (!found)
                    resolve('ไม่มีอาหารที่มีคุณลักษณะนี้ในระบบ\nกรุณาพิมพ์ ขอเลือกใหม่ เพื่อระบุเงื่อนไขอีกครั้ง');
                else {
                    Foods.find(query).lean().exec((err, selectedFoods) => {
                        if (err)
                            reject(err);
                        else {
                            success = true;
                            try {
                                const user_id = req.body.originalDetectIntentRequest.payload.data.source.userId;
                                UserHistory.find({
                                    user_id: user_id,
                                    food: { $in: selectedFoods.map(f => f) },
                                }).populate('food').lean().exec((err, selectedUserHistory) => {
                                    if (err)
                                        reject(err);

                                    const selectedUserHistoryLength = selectedUserHistory.length | 0;
                                    if (selectedUserHistoryLength <= 10)
                                        resolve(recommend.randomRecommend(selectedFoods));
                                    //else if (userHistoryLength <= 50)
                                    else
                                        resolve(recommend.biasRandomRecommend(selectedFoods, selectedUserHistory));
                                });
                            }
                            catch (err) {
                                resolve(recommend.randomRecommend(selectedFoods));
                            }
                        }
                    });
                }
            })
        })
            .then((msg) => {
                let newResponse = new fulfillmentResponse;
                if (success) {
                    newResponse.fulfillmentMessages[0].text.text[0] = `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`;
                    newResponse.fulfillmentMessages.push({
                        payload: {
                            line: {
                                type: "template",
                                altText: `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`,
                                template: {
                                    type: "confirm",
                                    text: `เราขอแนะนำเมนู ${msg}`,
                                    actions: [
                                        {
                                            "type": "message",
                                            "label": "ถูกใจ",
                                            "text": "ถูกใจ"
                                        },
                                        {
                                            "type": "message",
                                            "label": "ไม่ถูกใจ",
                                            "text": "ไม่ถูกใจ"
                                        }
                                    ]
                                }
                            }
                        }
                    });

                    newResponse.outputContexts = req.body.queryResult.outputContexts;
                    const contextPrefix = getContextPrefix(newResponse.outputContexts);
                    newResponse.outputContexts.push({
                        name: `${contextPrefix}/response`,
                        lifespanCount: 2,
                        parameters: { food: msg }
                    });
                }
                else
                    newResponse.fulfillmentMessages[0].text.text[0] = `${msg}`;

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
                    const user_id = req.body.originalDetectIntentRequest.payload.data.source.userId;
                    UserHistory.find({ user_id: user_id }).populate('food').lean().exec((err, userHistory) => {
                        if (err)
                            reject(err);

                        const userHistoryLength = userHistory.length | 0;
                        if (userHistoryLength <= 10)
                            resolve(recommend.randomRecommend(foods));
                        //else if (userHistoryLength <= 50)
                        else
                            resolve(recommend.biasRandomRecommend(foods, userHistory));
                    });
                }
                catch (err) {
                    resolve(recommend.randomRecommend(foods));
                }
            });
        })
            .then((msg) => {
                let newResponse = new fulfillmentResponse;
                newResponse.fulfillmentMessages[0].text.text[0] = `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`;
                    newResponse.fulfillmentMessages.push({
                        payload: {
                            line: {
                                type: "template",
                                altText: `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`,
                                template: {
                                    type: "confirm",
                                    text: `เราขอแนะนำเมนู ${msg}`,
                                    actions: [
                                        {
                                            "type": "message",
                                            "label": "ถูกใจ",
                                            "text": "ถูกใจ"
                                        },
                                        {
                                            "type": "message",
                                            "label": "ไม่ถูกใจ",
                                            "text": "ไม่ถูกใจ"
                                        }
                                    ]
                                }
                            }
                        }
                    });

                newResponse.outputContexts = req.body.queryResult.outputContexts;
                const contextPrefix = getContextPrefix(newResponse.outputContexts);
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
            console.log('no user id available, use testID instead');
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
                                res.sendStatus(200);
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
    }

    else {
        recommend.retrieveTag();
        res.sendStatus(200);
    }
});

module.exports = router;