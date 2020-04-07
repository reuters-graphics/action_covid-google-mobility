const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const axios = require('axios');

const headline_figures =
  'https://raw.githubusercontent.com/datasciencecampus/google-mobility-reports-data/master/csvs/uk-international-percentage-falls.csv';
const SOURCE_PATH_HEADLINES = path.resolve(
  __dirname,
  'data/headline_figures.csv'
);

async function downloadLatest(file, to_location) {
  const writer = fs.createWriteStream(to_location);

  const response = await axios({
    url: file,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

const parseCSVToJSON = (path) =>
  csv()
    .fromFile(path)
    .then((jsonObj) => {
      console.log(jsonObj);
    });

const run = async () => {
  try {
    await downloadLatest(headline_figures, SOURCE_PATH_HEADLINES);
    parseCSVToJSON(SOURCE_PATH_HEADLINES);
  } catch (err) {
    throw err;
  }
};

run();
