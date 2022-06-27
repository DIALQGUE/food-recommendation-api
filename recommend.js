const express = require('express');
// const exphbs = require('express-handlebars');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

const logger = require('./middleware/logger');
const foodsRouter = require('./routes/api/foods');
const fulfillmentRouter = require('./routes/api/fulfillment');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));


// app.engine('handlebars', exphbs.engine({ defaultLayout: 'base'}));
// app.set('view engine', 'handlebars');
app.use(morgan('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger);

app.use('/api/foods', foodsRouter);
app.use('/api/fulfillment', fulfillmentRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));