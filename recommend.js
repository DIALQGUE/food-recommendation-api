const express = require('express');
const exphbs = require('express-handlebars');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const logger = require('./middleware/logger');
const router = require('./routes/api/foods');

const {
  WebhookClient
} = require('dialogflow-fulfillment');
const { application } = require('express');

const app = express();

app.use(express.static(path.join(__dirname, 'public')))

app.engine('handlebars', exphbs.engine({ defaultLayout: 'base'}));
app.set('view engine', 'handlebars');
app.use(morgan('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger);

app.use('/api/foods', router);

let foods = JSON.parse(fs.readFileSync('foods.json'));

app.get('/', (req, res) => {
  res.render('home', {
    foods
  });
})

app.post('/webhook', (req, res) => {
  console.log('POST: /');
  console.log('Body: ', req.body);

  //Create an instance
  const agent = new WebhookClient({
    request: req,
    response: res
  });

  //Test get value of WebhookClient
  console.log('agentVersion: ' + agent.agentVersion);
  console.log('intent: ' + agent.intent);
  console.log('locale: ' + agent.locale);
  console.log('query: ', agent.query);
  console.log('session: ', agent.session);

  //Function Location
  function recommendFromCategory(agent) {
    agent.add('กิน...กันเถอะ');
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Recommend - custom - yes', recommendFromCategory);  // "Location" is once Intent Name of Dialogflow Agent
  agent.handleRequest(intentMap);
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));