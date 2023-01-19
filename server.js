const dotenv = require('dotenv');
dotenv.config();
const app = require('./app');
let mySqlConnection = require('./connection')
global.__basedir = __dirname;

app.listen(4000)