const mongoose = require('mongoose');
const dbURL = "mongodb+srv://WNWNS:FoodRecommendation@stelligence.tilzz.mongodb.net/FoodRecommendation?retryWrites=true&w=majority";

mongoose.connect(dbURL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => console.log('Connected to MongoDB Atlas')).catch(err => console.log(err));

const db = mongoose.connection
const Schema = mongoose.Schema

const tagSchema = new Schema({
    ingredient: [String],
    taste: [String],
    cuisine: [String]
})

const foodsSchema = new Schema({
    id: Schema.Types.ObjectId,
    name: {type: String, required: true},
    eng_name: {type: String, required: true},
    tag: tagSchema
}, {collection: 'Foods'});

foodsSchema.set('toJSON', { getters: true, virtuals: false });

const Foods = module.exports = mongoose.model('Foods', foodsSchema);