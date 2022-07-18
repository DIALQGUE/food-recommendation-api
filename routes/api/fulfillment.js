const { response } = require('express');
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
    "fulfillmentMessages": [],
    "outputContexts": []
}

router.post('/', function (req, res) {

    const intent = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;

    if (intent === 'Recommend' || intent === 'Recommend - unaccepted - yes') {
        recommend.retrieveTag();
        let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
        newResponse.fulfillmentMessages[0] = {
            payload: {
                line: {
                    type: "text",
                    text: "อยากกินอะไรเป็นพิเศษหรือเปล่า บอกเรามาเลย",
                    quickReply: {
                        items: [{
                            type: "action",
                            action: {
                                type: "message",
                                label: "อะไรก็ได้",
                                text: "อะไรก็ได้"
                            }
                        }]
                    }
                }
            }
        }

        return new Promise((resolve, reject) => {
            resolve(recommend.latestTag());
        }).then(([firstTag, secondTag, thirdTag]) => {
            newResponse.fulfillmentMessages[0].payload.line.quickReply.items[1] = {
                type: "action",
                action: {
                    type: "message",
                    label: `อยากกิน${firstTag}`,
                    text: `อยากกิน${firstTag}`
                }
            }
            newResponse.fulfillmentMessages[0].payload.line.quickReply.items[2] = {
                type: "action",
                action: {
                    type: "message",
                    label: `อยากกิน${secondTag}`,
                    text: `อยากกิน${secondTag}`
                }
            }
            newResponse.fulfillmentMessages[0].payload.line.quickReply.items[3] = {
                type: "action",
                action: {
                    type: "message",
                    label: `อยากกิน${thirdTag}`,
                    text: `อยากกิน${thirdTag}`
                }
            }
            res.send(newResponse);
        });
    }

    else if (intent == 'History') {
        let user_id = 'testID';
        try {
            user_id = req.body.originalDetectIntentRequest.payload.data.source.userId;
        }
        catch (err) {
            console.log('no user id available, use testID instead');
        }
        return new Promise((resolve, reject) => {
            UserHistory.find({ user_id: user_id }).sort({ date: -1 }).limit(10)
                .populate('food').lean().exec((err, history) => {
                    if (err) {
                        reject('เกิดความผิดพลาดขึ้นในระบบ กรุณาลองใหม่อีกครั้ง');
                    }
                    else {
                        let historyLength = history.length;
                        if (historyLength == 0)
                            reject('คุณยังไม่มีประวัติการทานอาหารในระบบ เริ่มถามเพื่อสร้างประวัติการทานอาหารของคุณ');
                        let historyList = [];
                        for (let i = 0; i < historyLength; i++)
                            historyList.push(`${history[i].food.name}:${history[i].date.getDay()}:${history[i].date.toLocaleDateString(locales = 'th-TH')}`);
                        resolve([historyLength, historyList]);
                    }
                });
        })
            .then(([historyLength, historyList]) => {
                let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
                newResponse.fulfillmentMessages.push(recommend.imageCarouselResponse(historyList));
                res.send(newResponse);
            })
            .catch((err) => {
                let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
                newResponse.fulfillmentMessages.push(recommend.beginResponse(err));
                res.send(newResponse);
            });
    }

    else if (intent === 'Recommend - condition') {
        let success = false;
        return new Promise((resolve, reject) => {
            const condition = parameters.condition;
            let rejected = [];
            try {
                rejected = req.body.queryResult.outputContexts.find(context => context.name.includes('/response')).parameters.food
            }
            catch (err) {
                console.log('no response context available');
            }

            console.log(`recommending for condition: ${condition}`);
            let query = {
                $or: [
                    { name: { $regex: `.*${condition}.*`, $nin: rejected } },
                    { 'tag.ingredient': `${condition}` },
                    { 'tag.taste': `${condition}` },
                    { 'tag.cuisine': `${condition}` }
                ]
            };
            Foods.findOne(query).lean().exec((err, found) => {
                if (!found)
                    resolve('ไม่มีอาหารที่มีคุณลักษณะนี้ในระบบ หรือได้ถูกปฏิเสธจากผู้ใช้ทั้งหมดแล้ว\nกรุณาพิมพ์ ไม่ยอมรับ เพื่อระบุเงื่อนไขอีกครั้ง');
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
                let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
                newResponse.outputContexts = req.body.queryResult.outputContexts;
                if (success) {
                    newResponse.fulfillmentMessages.push({
                        payload: {
                            line: {
                                type: "template",
                                altText: `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`,
                                template: {
                                    type: "confirm",
                                    text: `เราขอแนะนำเมนู\n${msg}`,
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
                    try {
                        responseContext = newResponse.outputContexts.filter(oc => oc['name'].includes('/response'))[0];
                        responseContext.parameters.food.push(msg);
                        Object.assign(responseContext, { lifespanCount: 3 });
                    }
                    catch (err) {
                        console.log(err);
                        const contextPrefix = getContextPrefix(newResponse.outputContexts);
                        newResponse.outputContexts.push({
                            name: `${contextPrefix}/response`,
                            lifespanCount: 3,
                            parameters: { food: [msg] }
                        });
                    }
                }
                else {
                    newResponse.fulfillmentMessages[0] = {
                        payload: {
                            line: {
                                type: "text",
                                text: `${msg}`,
                                quickReply: {
                                    items: [{
                                        type: "action",
                                        action: {
                                            type: "message",
                                            label: "ไม่ยอมรับ",
                                            text: "ไม่ยอมรับ"
                                        }
                                    }]
                                }
                            }
                        }
                    }
                }
                res.send(newResponse);
            })
            .catch(err => {
                console.log(err);
            });
    }

    else if (intent === 'Recommend - no condition') {
        return new Promise((resolve, reject) => {
            rejected = [];
            try {
                rejected = req.body.queryResult.outputContexts.find(context => context.name.includes('/response')).parameters.food
            }
            catch (err) {
                console.log('no response context available');
            }
            Foods.find({ name: { $nin: rejected } }).lean().exec((err, foods) => {
                if (err || !foods)
                    resolve('อาหารในระบบได้ถูกปฏิเสธจากผู้ใช้ทั้งหมดแล้ว\nกรุณาพิมพ์ว่า วันนี้กินอะไรดี เพื่อเริ่มการสนทนาใหม่อีกครั้ง');
                try {
                    const user_id = req.body.originalDetectIntentRequest.payload.data.source.userId;
                    UserHistory.find({ user_id: user_id })
                        .populate('food').lean().exec((err, userHistory) => {
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
                let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
                newResponse.fulfillmentMessages[0] = {
                    payload: {
                        line: {
                            type: "template",
                            altText: `เราขอแนะนำเมนู ${msg}\nเมนูนี้ถูกใจคุณรึเปล่า`,
                            template: {
                                type: "confirm",
                                text: `เราขอแนะนำเมนู\n${msg}`,
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
                }

                newResponse.outputContexts = req.body.queryResult.outputContexts;
                try {
                    responseContext = newResponse.outputContexts.filter(oc => oc['name'].includes('/response'))[0];
                    responseContext.parameters.food.push(msg);
                    Object.assign(responseContext, { lifespanCount: 3 });
                }
                catch (err) {
                    console.log(err);
                    const contextPrefix = getContextPrefix(newResponse.outputContexts);
                    newResponse.outputContexts.push({
                        name: `${contextPrefix}/response`,
                        lifespanCount: 3,
                        parameters: { food: [msg] }
                    });
                }

                res.send(newResponse);
            })
            .catch(err => {
                let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
                newResponse.fulfillmentMessages[0] = {
                    payload: {
                        line: {
                            type: "text",
                            text: `${msg}`,
                            quickReply: {
                                items: [{
                                    type: "action",
                                    action: {
                                        type: "message",
                                        label: "วันนี้กินอะไรดี",
                                        text: "วันนี้กินอะไรดี"
                                    }
                                }]
                            }
                        }
                    }
                }
                res.send(newResponse);
            });
    }

    else if (intent === 'Recommend - accepted') {
        let user_id = 'testID';
        try {
            user_id = req.body.originalDetectIntentRequest.payload.data.source.userId;
        }
        catch (err) {
            console.log('no user id available, use testID instead');
        }
        const lastSuggestion = req.body.queryResult.outputContexts.find(context => context.name.includes('/response')).parameters.food.at(-1);
        console.log(`last suggestion: ${lastSuggestion}`);
        Foods.findOne({ name: lastSuggestion }).exec((err, found) => {
            if (!found) {
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

    else if (intent === 'Default Welcome Intent') {
        let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
        newResponse.fulfillmentMessages.push(recommend.beginResponse('สวัสดีนะ หิวแล้วรึยัง'));
        res.send(newResponse);
    }

    else if (intent === 'Default Fallback Intent') {
        let newResponse = JSON.parse(JSON.stringify(fulfillmentResponse));
        newResponse.fulfillmentMessages.push(recommend.beginResponse('ขออภัย เราไม่เข้าใจคุณ กรุณาพิมพ์ว่า วันนี้กินอะไรดี เพื่อเริ่มการสนทนาใหม่อีกครั้ง'));
        res.send(newResponse);
    }

    else {
        res.sendStatus(200);
    }
});

module.exports = router;