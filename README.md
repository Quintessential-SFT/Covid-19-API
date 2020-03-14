# Covid-19 Virus Data API

As more and more people are closely following the current global pandemic, we've built this API for easy access
to easily access John Hopkins CSSE data from: https://github.com/CSSEGISandData/COVID-19.

Updated: This repo now also sources data from: https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6 so as to always show the latest data.

The API automatically updates every hour, by checking for new data. It exposes several REST endpoints.

## Fight misinformation and fake news
One of the reasons we built this API is to help developers create tools and applications that help fight the misinformation being spread around the Covid-19 virus. Send us a mail about your creation and we'll put a link on the Readme to help people get accurate data.

### How to run:

- Clone this repo
- npm install
- npm start 

### Run with docker

- Follow the previous steps
- Instead of npm start, run npm build:docker

### Contributors
You are free to contribute by opening a pull request to the repo
