const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const axios = require('axios');
const d3 = Object.assign({}, require('d3-collection'));

const headline_figures =
  'https://raw.githubusercontent.com/datasciencecampus/google-mobility-reports-data/master/csvs/international_national_trends_G20_SE.csv';
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

async function parseCSVToJSON(source_path) {
  const parsedCSV = await csv()
    .fromFile(source_path)
    .then((jsonObj) => jsonObj);

  const uniqueDates = Object.keys(parsedCSV[0]).splice(
    3,
    Object.keys(parsedCSV[0]).length - 1
  );

  const data = { series: uniqueDates, data: {} };

  const groupByCountry = d3
    .nest()
    .key((d) => d.Country)
    .key((d) => d.Category)
    .entries(parsedCSV);

  for (let i = 0; i < groupByCountry.length; i++) {
    const country = groupByCountry[i].key;
    const countryData = groupByCountry[i].values;
    data.data[country] = [];

    for (let z = 0; z < countryData.length; z++) {
      const category = countryData[z].key;
      const categoryData = countryData[z].values;

      const simpleData = data.series.map((e) => {
        const match = categoryData[0][e];
        if (match) {
          return parseInt(match);
        }
      });

      const categoryAndData = {};
      categoryAndData[category] = simpleData;

      data.data[country].push(categoryAndData);
    }
  }
  writeJSONLocally(data, path.resolve(__dirname, 'data/latest_parsed.json'));
  console.log(data.data);
}

const writeJSONLocally = (data, location) =>
  fs.writeFileSync(location, JSON.stringify(data, 4));

const run = async () => {
  try {
    await downloadLatest(headline_figures, SOURCE_PATH_HEADLINES);
    await parseCSVToJSON(SOURCE_PATH_HEADLINES);
  } catch (err) {
    throw err;
  }
};

run();
