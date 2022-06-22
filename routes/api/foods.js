const express = require('express');
const fs = require('fs');

const {
    WebhookClient
} = require('dialogflow-fulfillment');

const router = express.Router();

let foods = JSON.parse(fs.readFileSync('foods.json'));

router.get('/', function (req, res) {
    res.send(foods);
});

router.get('/:name', function (req, res) {
    let found = foods.some(food => food.name === req.params.name);
    if (found) {
        res.send(foods.filter(food => food.name === req.params.name));
    }
    else {
        res.status(400).json({ msg: `No food with name ${req.params.name}` })
    }
});

router.post('/', function (req, res) {
    const newFood = {
        name: req.body.name,
        eng_name: req.body.eng_name,
        rice: req.body.rice,
        meat: req.body.meat,
        spicy: req.body.spicy,
        seafood: req.body.seafood,
        green_level: req.body.green_level,
        contain_nut: req.body.contain_nut,
        contain_milk: req.body.contain_milk,
        avg_calories: req.body.avg_calories,
        cuisine: req.body.cuisine
    }
    if (!newFood.name) {
        return res.status(400).json({ msg: 'Please include a name' });
    }
    foods.push(newFood);
    // fs.writeFileSync('./foods.json', JSON.stringify(foods, null, 2));
    res.send(foods);
})

router.put('/:name', function (req, res) {
    let found = foods.some(food => food.name === req.params.name);
    if (found) {
        const updateFood = req.body;
        foods.forEach(food => {
            if (food.name === req.params.name) {
                food.name = updateFood.name ? updateFood.name : food.name;
                food.eng_name = updateFood.eng_name ? updateFood.eng_name : food.eng_name;
                food.rice = updateFood.rice ? updateFood.rice : food.rice;
                food.meat = updateFood.meat ? updateFood.meat : food.meat;
                food.spicy = updateFood.spicy ? updateFood.spicy : food.spicy;
                food.seafood = updateFood.seafood ? updateFood.seafood : food.seafood;
                food.green_level = updateFood.green_level ? updateFood.green_level : food.green_level;
                food.contain_nut = updateFood.contain_nut ? updateFood.contain_nut : food.contain_nut;
                food.contain_milk = updateFood.contain_milk ? updateFood.contain_milk : food.contain_milk;
                food.avg_calories = updateFood.avg_calories ? updateFood.avg_calories : food.avg_calories;
                food.cuisine = updateFood.cuisine ? updateFood.cuisine : food.cuisine;

                res.json({ msg: 'Food updated', food });
            }
        })
    }
    else {
        res.status(400).json({ msg: `No food with name ${req.params.name}` })
    }
})

router.delete('/:name', function (req, res) {
    let found = foods.some(food => food.name === req.params.name);
    if (found) {
        res.json({
            msg: 'Food deleted',
            users: foods = foods.filter(food => food.name !== req.params.name)
        })
    }
    else {
        res.status(400).json({ msg: `No food with name ${req.params.name}` })
    }
});

router.post('/dialogflow-fulfillment', function(req, res) {
    const agent = new WebhookClient({
        request: req,
        response: res
    });


    function recommendFromCategory(agent) {
        agent.add(`กิน${agent.parameters['category']}กันเถอะ`);
    }

    function recommend(agent) {
        var keys = Object.keys(foods);
        var food = foods[keys[keys.length * Math.random() << 0]];
        agent.add('งั้นกินไอ้นี่แล้วกันนะ');
        console.log(`randomized food: ${food.name}`);
        agent.add(`${food.name}`);
    }

    let intentMap = new Map();
    intentMap.set('Recommend - custom - yes', recommendFromCategory);
    intentMap.set('Recommend - no', recommend);
    agent.handleRequest(intentMap);
});

module.exports = router;