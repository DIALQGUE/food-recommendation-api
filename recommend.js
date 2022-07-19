const { Foods, UserHistory } = require('./models/foods-model');

var ingredient = [], taste = [], cuisine = [];
var dayText = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

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

async function latestTag() {
    console.log("latestTag");
    // var latest = await UserHistory.find({}).populate('food').sort({ date: -1 }).limit(50);
    // let tagCount = new Map();
    // latest.forEach(record => {
    //     record = record.food;
    //     if (record.tag.ingredient) {
    //         record.tag.ingredient.forEach(ingredient => {
    //             if (tagCount.has(ingredient)) {
    //                 tagCount.set(ingredient, tagCount.get(ingredient) + 1);
    //             }
    //             else {
    //                 tagCount.set(ingredient, 1);
    //             }
    //         }
    //         )
    //     }
    // });
    // sortedTagCount = new Map([...tagCount].sort((a, b) => b[1] - a[1]));
    // [firstTag, secondTag, thirdTag] = sortedTagCount.keys();
    [firstTag, secondTag, thirdTag] = ['หมู', 'อาหารญี่ปุ่น', 'ของหวาน'];
    console.log(firstTag, secondTag, thirdTag);
    return [firstTag, secondTag, thirdTag];
}

function randomRecommend(foods) {
    console.log("randomRecommend");
    var random = Math.floor(Math.random() * foods.length);
    return foods[random];
}

function biasRandomRecommend(foods, userHistory) {
    console.log("biasRandomRecommend");
    pastFoods = userHistory.map(record => record.food);
    biasFoods = foods.concat(pastFoods);
    var random = Math.floor(Math.random() * foods.length);
    return foods[random];
}

function beginResponse(text) {
    return {
        payload: {
            line: {
                type: "text",
                text: text,
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
}

function buttonResponse(food) {
    let name = food.name
    let img = food.img
    let response = {
        payload: {
            line: {
                type: "template",
                altText: `เราขอแนะนำเมนู ${name}\nเมนูนี้ถูกใจคุณรึเปล่า`,
                template: {
                    type: "buttons",
                    thumbnailImageUrl: img + ".jpg",
                    imageAspectRatio: "square",
                    title: name,
                    text: `เราขอแนะนำเมนู\n${name}`,
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
    return response;
}

function imageCarouselResponse(displayList) {
    let response = {
        payload: {
            line: {
                type: "template",
                altText: "นี่คือประวัติการทานอาหารของคุณ",
                template: {
                    type: "carousel",
                    imageAspectRatio: "square",
                    imageSize: "cover",
                    columns: []
                }
            }
        }
    };
    displayList.forEach(display => {
        let name = display.food.name;
        let img = display.food.img;
        let day = display.date.getDay()
        let date = display.date.toLocaleDateString(locales = 'th-TH');
        response.payload.line.template.columns.push({
            thumbnailImageUrl: img + ".jpg",
            title: name,
            text: dayText[day] + " " + date,
            defaultAction: {
                type: "message",
                label: name,
                text: "อยากกิน" + name
            },
            actions: [
                {
                    type: "message",
                    label: "ทานเมนูนี้อีกครั้ง",
                    text: "อยากกิน" + name
                }
            ]
        });
    });
    return response;
}


module.exports = {
    randomRecommend,
    biasRandomRecommend,
    retrieveTag,
    latestTag,
    beginResponse,
    buttonResponse,
    imageCarouselResponse
};