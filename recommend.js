const express = require('express');
// const exphbs = require('express-handlebars');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const logger = require('./middleware/logger');
const router = require('./routes/api/foods');

const app = express();

app.use(express.static(path.join(__dirname, 'public')))

// app.engine('handlebars', exphbs.engine({ defaultLayout: 'base'}));
// app.set('view engine', 'handlebars');
app.use(morgan('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger);

app.use('/api/foods', router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));