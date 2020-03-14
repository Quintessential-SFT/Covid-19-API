const express = require('express');
const router = express.Router();
const dataProvider = require('../services/index');

/**
 * @api {get} /data Request the latest Global data
 * @apiName GetData
 * @apiGroup Data
 *
 * @apiSuccess {JsonArray} JsonArray ﻿Province/State,Country/Region, Last Update, Confirmed, Deaths, Recovered, Latitude, Longitude.
 */
router.get('/', function (req, res, next) {
    dataProvider
        .getDataFile()
        .then(r => {
            res.json(r);
        })
        .catch(err => {
            res.status(500).json({message: "Well that did not go well"});
        });

});

/**
 * @api {get} /data/country/:countryName Request the latest Country data
 * @apiName GetCountryData
 * @apiGroup Data
 *
 * @apiParam {String} countryName The Country name
 *
 * @apiSuccess {JsonArray} JsonArray ﻿Province/State,Country/Region, Last Update, Confirmed, Deaths, Recovered, Latitude, Longitude.
 */
router.get('/country/:countryName', function (req, res, next) {
    dataProvider
        .getByCountry(req.params.countryName)
        .then(r => {
            res.json(r);
        })
        .catch(err => {
            res.status(500).json({message: "Well that did not go well"});
        });
});

/**
 * @api {get} /data/date/:date Request the global data for a specific date
 * @apiName GetDateData
 * @apiGroup Data
 *
 * @apiParam {String} date The date in a format MM-DD-YYYY
 *
 * @apiSuccess {JsonArray} JsonArray ﻿Province/State,Country/Region, Last Update, Confirmed, Deaths, Recovered, Latitude, Longitude.
 */
router.get('/date/:date', function (req, res, next) {
    dataProvider
        .getByDate(req.params.date)
        .then(r => {
            res.json(r);
        })
        .catch(err => {
            res.status(500).json({message: "Well that did not go well"});
        });
});

/**
 * @api {get} /data/custom?country=countryName&date=dateString Request a custom dataset
 * @apiName GetCustomData
 * @apiGroup Data
 *
 * @apiSuccess {JsonArray} JsonArray ﻿Province/State,Country/Region, Last Update, Confirmed, Deaths, Recovered, Latitude, Longitude.
 */
router.get('/custom', function (req, res, next) {
    if (!(req.query.date || req.query.country)) {
        res.status(400).json({message: 'You need to send a date or country or both'});
    } else {
        let options = {
            date: req.query.date,
            country: req.query.country
        };
        dataProvider
            .getCustom(options)
            .then(r => {
                res.json(r);
            })
            .catch(err => {
                res.status(500).json({message: "Well that did not go well"});
            });
    }
});

module.exports = router;
