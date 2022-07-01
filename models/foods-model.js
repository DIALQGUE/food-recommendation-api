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

const userHistorySchema = new Schema({
    id: Schema.Types.ObjectId,
    user_id: {type: String, required: true},
    food: {type: Schema.Types.ObjectId, ref: 'Foods'},
    date: {type: Date, default: Date.now},
}, {collection: 'UserHistory'});

foodsSchema.set('toJSON', { getters: true, virtuals: false });
userHistorySchema.set('toJSON', { getters: true, virtuals: false });

const Foods = mongoose.model('Foods', foodsSchema);
const UserHistory = mongoose.model('UserHistory', userHistorySchema);

module.exports = { Foods, UserHistory };