const express = require('express');
const { Foods, UserHistory } = require('../../models/foods-model');

const router = express.Router();

//let foods = JSON.parse(fs.readFileSync('foods.json'));

router.get('/', function (req, res) {
    Foods.find().lean().exec((err, foods) => {
        if (err) throw err;
        res.send(foods);
    });
});

router.get('/history', function (req, res) {
    UserHistory.find().populate('food').lean().exec((err, history) => {
        if (err) throw err;
        res.send(history);
    });
});

router.get('/tag', async function (req, res, next) {
    var tagList = [];
    Foods.find().distinct('tag.ingredient').lean().exec((err, tags) => {
        if (err) res.status(400).send(err);
        tagList.push(tags);
        Foods.find().distinct('tag.taste').lean().exec((err, tags) => {
            if (err) res.status(400).send(err);
            tagList.push(tags);
            Foods.find().distinct('tag.cuisine').lean().exec((err, tags) => {
                if (err) res.status(400).send(err);
                tagList.push(tags);
                res.send(tagList);
            });
        });
    });
});

router.get('/:name', function (req, res) {
    Foods.find({ name: req.params.name }).lean().exec((err, foods) => {
        if (err) throw err;
        if (foods.length === 0)
            res.status(400).json({ msg: `No food with name ${req.params.name}` })
        else
            res.send(food);
    });
});

router.post('/:multiple', function (req, res) {
    if (req.params.multiple === 'true') {
        const foods = req.body;
        foods.forEach(food => {
            let newFood = new Foods({
                name: food.name,
                eng_name: food.eng_name,
                tag: food.tag,
                img: food.img
            });
            if (!newFood.name) {
                return res.status(400).json({ msg: 'Please include a name for every food' });
            }
            newFood.save();
        });
        res.json({ msg: `all foods have been added` });
    }
    else {
        const food = req.body;
        let newFood = new Foods({
            name: food.name,
            eng_name: food.eng_name,
            tag: food.tag,
            img: food.img
        });
        if (!newFood.name) {
            return res.status(400).json({ msg: 'Please include a name' });
        }
        newFood.save();
        res.json({ msg: `${food.name} has been added` });
    }
});

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

module.exports = router;