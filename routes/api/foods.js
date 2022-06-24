const express = require('express');
const fs = require('fs');
const Foods = require('../../models/foods-model');

const {
    WebhookClient
} = require('dialogflow-fulfillment');

const router = express.Router();

//let foods = JSON.parse(fs.readFileSync('foods.json'));

router.get('/', function (req, res) {
    Foods.find().lean().exec((err, food) => {
        if (err) throw err;
        res.json(food);
    });
});

router.get('/:name', function (req, res) {
    Foods.find({ name: req.params.name }).lean().exec((err, food) => {
        if (err) throw err;
        if (food.length === 0)
            res.status(400).json({ msg: `No food with name ${req.params.name}` })
        else
            res.json(food);
    });
});

router.post('/', function (req, res) {
    const food = req.body;
    let newFood = new Foods({
        name: food.name,
        eng_name: food.eng_name,
        tag: food.tag
    });
    if (!newFood.name) {
        return res.status(400).json({ msg: 'Please include a name' });
    }
    newFood.save();
    res.send(food);
})

// router.put('/:name', function (req, res) {
//     let found = foods.some(food => food.name === req.params.name);
//     if (found) {
//         const updateFood = req.body;
//         foods.forEach(food => {
//             if (food.name === req.params.name) {
//                 food.name = updateFood.name ? updateFood.name : food.name;
//                 food.eng_name = updateFood.eng_name ? updateFood.eng_name : food.eng_name;
//                 food.rice = updateFood.rice ? updateFood.rice : food.rice;
//                 food.meat = updateFood.meat ? updateFood.meat : food.meat;
//                 food.spicy = updateFood.spicy ? updateFood.spicy : food.spicy;
//                 food.seafood = updateFood.seafood ? updateFood.seafood : food.seafood;
//                 food.green_level = updateFood.green_level ? updateFood.green_level : food.green_level;
//                 food.contain_nut = updateFood.contain_nut ? updateFood.contain_nut : food.contain_nut;
//                 food.contain_milk = updateFood.contain_milk ? updateFood.contain_milk : food.contain_milk;
//                 food.avg_calories = updateFood.avg_calories ? updateFood.avg_calories : food.avg_calories;
//                 food.cuisine = updateFood.cuisine ? updateFood.cuisine : food.cuisine;

//                 res.json({ msg: 'Food updated', food });
//             }
//         })
//     }
//     else {
//         res.status(400).json({ msg: `No food with name ${req.params.name}` })
//     }
// })

// router.delete('/:name', function (req, res) {
//     let found = foods.some(food => food.name === req.params.name);
//     if (found) {
//         res.json({
//             msg: 'Food deleted',
//             users: foods = foods.filter(food => food.name !== req.params.name)
//         })
//     }
//     else {
//         res.status(400).json({ msg: `No food with name ${req.params.name}` })
//     }
// });

router.post('/dialogflow-fulfillment', function (req, res) {
    const agent = new WebhookClient({
        request: req,
        response: res
    });


    function recommendFromCategory(agent) {
        Foods.findOne({ name: req.params.name }).lean().exec((err, found) => {
            if (err) throw err;
            if (!found)
                agent.add('ไม่มีอาหารที่มีคุณลักษณะนี้ในระบบ');
            else {
                let selectedFoods = Foods.find({ name: agent.parameters.condition });
                selectedFoods.countDocuments().exec(function (err, count) {
                    if (err) throw err;

                    var random = Math.floor(Math.random() * count)
                    selectedFoods.findOne().skip(random).exec((err, food) => {
                        if (err) throw err;
                        console.log(`randomized food: ${food.name}`);
                        agent.add(`กิน${food.name}กันเถอะ`);
                    });
                });
            }
        });
    }

    function recommend(agent) {
        Foods.countDocuments().exec(function (err, count) {
            if (err) throw err;

            var random = Math.floor(Math.random() * count)
            Foods.findOne().skip(random).exec((err, food) => {
                if (err) throw err;
                agent.add('งั้นกินเมนูนี้แล้วกันนะ');
                console.log(`randomized food: ${food.name}`);
                agent.add(`${food.name}`);
            });
        });
    }

    let intentMap = new Map();
    intentMap.set('Recommend - condition - yes', recommendFromCategory);
    intentMap.set('Recommend - no condition', recommend);
    agent.handleRequest(intentMap);
});

module.exports = router;