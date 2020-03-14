const request = require('request');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const parser = require('papaparse');

const GIT_PATH = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';

function dataDownload(date) {
    return new Promise((resolve, reject) => {
        request(GIT_PATH + date + '.csv', function (error, response, body) {
            if (error || response.statusCode !== 200) {
                return reject("Failed to download");
            }
            fs.writeFile(path.resolve(__dirname, '../data/' + date + '.csv'), body, (err) => {
                if (err) {
                    console.error(err);
                    reject("Failed to download");
                } else {
                    resolve("done");
                }
            });
        });
    })
}

function initialize() {
    let date = new moment('01-22-2020', 'MM-DD-YYYY');
    let promise = new Promise((resolve => resolve()));
    while (date < new moment()) {
        let string = date.format('MM-DD-YYYY');
        date.add(1, 'day');
        let exists = fs.existsSync(path.resolve(__dirname, '../data/' + string + '.csv'));
        if (exists) continue;
        promise = promise
            .then(r => dataDownload(string.toString()))
            .then(r => {
                console.log('Finished download for: ', string);
            })
            .catch(err => {
                console.error("Failed to download: ", string);
            });


    }

    promise
        .then(r => {
            console.log("all done")
        })
        .catch(err => {
            console.log("Something went wrong while downloading files")
        })


}


function getLatest() {
    let date = new moment();
    let string = date.format('MM-DD-YYYY');
    dataDownload(string.toString())
        .then(r => {
            console.log('Finished download for: ', string);
        })
        .catch(err => {
            console.error("Failed to download: ", string);
        });

}

function getDataFile(dateInput) {
    let date = new moment();
    if (dateInput) {
        let dateTest = new moment(dateInput);
        let invalidDate = (dateTest > new moment()) || dateTest < new moment('01-22-2020', 'MM-DD-YYYY');
        if (!invalidDate) {
            date = new moment(dateInput);
        }
    }
    let string = date.format('MM-DD-YYYY');
    let exists = fs.existsSync(path.resolve(__dirname, '../data/' + string + '.csv'));
    while (!exists) {
        string = date.add(-1, 'day').format('MM-DD-YYYY');
        exists = fs.existsSync(path.resolve(__dirname, '../data/' + string + '.csv'))
    }
    let dataString = fs.readFileSync(path.resolve(__dirname, '../data/' + string + '.csv')).toString();
    return new Promise((resolve, reject) => {
        parser.parse(dataString, {
            header: true,
            complete: (r, e) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(r.data);
                }
            }
        })
    });
}

function getByCountry(country) {
    return getDataFile()
        .then(r => {
            return r.filter(r => r['Country/Region'].toLowerCase() === country.toLowerCase())
        })
}

function getByDate(date) {
    return getDataFile(date);
}

function getCustom(options) {

    return getDataFile(options.date)
        .then(r => {
            if (options.country) {
                return r.filter(r => r.country.toLowerCase() === options.country.toLowerCase())
            } else {
                return r;
            }
        })
}

module.exports = {
    initialize,
    getDataFile,
    getByCountry,
    getByDate,
    getCustom,
    getLatest
};
