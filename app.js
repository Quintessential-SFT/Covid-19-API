const express = require('express');
const logger = require('morgan');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require("express-rate-limit");
const publicPath = path.join(__dirname, '/doc');


const importer = require('./services/index');

const dataRouter = require('./routes/data');

const app = express();

// security modules
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 100
});

app.use(limiter);
app.use(helmet());

// Import utilities

importer.initialize();
const interval = setInterval(r => {
    importer.getLatest();
}, 60000 * 60);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(express.static(publicPath));


app.use('/data', dataRouter);

process.on('SIGTERM', () => {
    clearInterval(interval);
});

module.exports = app;
