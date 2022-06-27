const express = require('express');
// const exphbs = require('express-handlebars');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

const logger = require('./middleware/logger');
const router = require('./routes/api/foods');
const agent = require('./routes/api/fulfillment');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));


// app.engine('handlebars', exphbs.engine({ defaultLayout: 'base'}));
// app.set('view engine', 'handlebars');
app.use(morgan('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger);

app.use('/api/foods', router);
app.post('/api/fulfillment', agent);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));