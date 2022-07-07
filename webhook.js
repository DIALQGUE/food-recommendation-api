const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const favicon = require('serve-favicon');

const logger = require('./middleware/logger');
const foodsRouter = require('./routes/api/foods');
const fulfillmentRouter = require('./routes/api/fulfillment');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(morgan('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger);
app.use(favicon(path.join(__dirname, 'favicon.ico')));

app.use('/api/foods', foodsRouter);
app.use('/api/fulfillment', fulfillmentRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));