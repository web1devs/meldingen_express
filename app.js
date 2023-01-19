const express = require('express');
const app = express();
require(`./tools`)
require('./middlewares')(app);
require('./routes')(app);
require('./scraper')
module.exports = app ;