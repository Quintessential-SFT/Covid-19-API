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

function liveData(region) {
    let url;
    if (region.province) {
        url = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=(Confirmed > 0) AND (Country_Region=\'' + region.country + '\') AND (Province_State=\'' + region.province + '\')&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=[{"statisticType":"sum","onStatisticField":"Confirmed","outStatisticFieldName":"value"},{"statisticType":"sum","onStatisticField":"Recovered","outStatisticFieldName":"value2"},{"statisticType":"sum","onStatisticField":"Deaths","outStatisticFieldName":"value3"}]&outSR=102100&cacheHint=true';
    } else {
        url = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=(Confirmed > 0) AND (Country_Region=\'' + region.country + '\')&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=[{"statisticType":"sum","onStatisticField":"Confirmed","outStatisticFieldName":"value"},{"statisticType":"sum","onStatisticField":"Recovered","outStatisticFieldName":"value2"},{"statisticType":"sum","onStatisticField":"Deaths","outStatisticFieldName":"value3"}]&outSR=102100&cacheHint=true';
    }

    return new Promise((resolve, reject) => {
        request(url, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                return reject("Failed to download");
            }
            let data = JSON.parse(body);
            if (data.error) {
                return console.log("Failed to load data for: ", region);
            }
            data = data.features[0].attributes;
            data = {
                confirmed: data.value,
                recovered: data.value2,
                deaths: data.value3
            };
            resolve(data);
        });
    });
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
            getLatest();
            return "ok";
        })
        .then(r => {
            console.log("all done")
        })
        .catch(err => {
            console.log("Something went wrong while downloading files")
        })
}


function getLatest() {
    let date = new moment();
    let string = date.add(-1, 'day').format('MM-DD-YYYY');
    let dataString = fs.readFileSync(path.resolve(__dirname, '../data/' + string + '.csv')).toString();
    parser.parse(dataString, {
        header: true,
        transformHeader: function (h) {
            return h.trim();
        },
        complete: (r, e) => {
            let data = r.data;
            let regions = data.map(r => {
                if (r['Province/State'] && r['Province/State'].length > 1) {
                    return {country: r['Country/Region'], province: r['Province/State']}
                } else {
                    return {country: r['Country/Region']}
                }
            });
            let now = new moment().format('YYYY-MM-DDTHH:mm:ss');
            let results = [];
            let promise = new Promise(resolve => resolve());
            regions.forEach((r, i) => {
                promise = liveData(r)
                    .then(p => {
                        data[i]['Last Update'] = now;
                        data[i]['Confirmed'] = p.confirmed;
                        data[i]['Deaths'] = p.deaths;
                        data[i]['Recovered'] = p.recovered;
                    });
            });
            promise.then(r => {
                let newString = parser.unparse(data, {
                    delimiter: ",",
                    header: true,
                });
                let string = new moment().format('MM-DD-YYYY');
                fs.writeFileSync(path.resolve(__dirname, '../data/' + string + '.csv'), newString);
            })
        }
    });

}

function getDataFile(dateInput) {
    let date = new moment();
    if (dateInput) {
        let dateTest = new moment(dateInput, 'MM-DD-YYYY');
        let invalidDate = !dateTest.isValid() || (dateTest > new moment()) || dateTest < new moment('01-22-2020', 'MM-DD-YYYY');
        if (!invalidDate) {
            date = new moment(dateInput, 'MM-DD-YYYY');
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
                return r.filter(r => r['Country/Region'].toLowerCase() === options.country.toLowerCase())
            } else {
                return r;
            }
        })
}


function getRange(from, to, countries) {

    let date = new moment(from, 'MM-DD-YYYY');
    let endDate = new moment(to, 'MM-DD-YYYY');

    let promise = new Promise((resolve => resolve()));
    let results = [];
    while (date < endDate) {
        let dateString = date.format('MM-DD-YYYY');
        date.add(1, 'day');
        promise = promise
            .then(r => getDataFile(dateString))
            .then(r => {
                if (countries) {
                    return r.filter(r => r['Country/Region'] && countries.indexOf(r['Country/Region'].toLowerCase()) !== -1)
                } else {
                    return r;
                }
            })
            .then(r => {
                let dataAggregation = {
                    confirmed: 0,
                    recovered: 0,
                    deaths: 0
                };
                r.forEach(d => {
                    if (d['Confirmed'] && d['Confirmed'].trim() !== '') {
                        dataAggregation.confirmed += parseInt(d['Confirmed']);
                    }

                    if (d['Deaths'] && d['Deaths'].trim() !== '') {
                        dataAggregation.deaths += parseInt(d['Deaths']);
                    }

                    if (d['Recovered'] && d['Recovered'].trim() !== '') {
                        dataAggregation.recovered += parseInt(d['Recovered']);
                    }
                });
                results.push({
                    date: dateString,
                    ...dataAggregation
                })
            })
    }
    return promise.then(r => {
        return results;
    })

}

module.exports = {
    initialize,
    getDataFile,
    getByCountry,
    getByDate,
    getCustom,
    getRange,
    getLatest
};
