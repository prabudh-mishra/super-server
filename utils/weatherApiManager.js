const axios = require("axios");
const { getTodayAndThirtDaysAgo } = require("./dateUtils");
const { calculateEnergy } = require("./energyManager");

const WEATHER_API_URL = "https://api.weatherbit.io/v2.0/history/daily";

const getProductEnergyData = async (lat, lon, start, end, area = 10) => {
  try {
    const url =
      WEATHER_API_URL +
      `?lat=${lat}&lon=${lon}&start_date=${start}&end_date=${end}&key=${process.env.SOLAR_SENSE_WEATHER_API_KEY}`;
    const response = await axios.get(url);
    const { data: weatherDataSet } = response.data;

    const dailyReportList = [];
    weatherDataSet.forEach((weatherData) => {
      const { max_dni, datetime, max_temp_ts } = weatherData;

      const tempCofficient = new Date(max_temp_ts * 1000);
      const tempCofficientInHours = tempCofficient.getHours();
      const generatedElectricity =
        (area * max_dni * tempCofficientInHours) / 1000;

      dailyReportList.push({
        irradiance: max_dni,
        date: datetime,
        electricity: generatedElectricity,
      });
    });

    return dailyReportList;
  } catch (error) {
    throw new Error("Error fetching location weather report: " + error.message);
  }
};

async function getWeatherData(location, start_date, end_date) {
  const { _id, name, lat, lon, tilt, area, orientation } = location;
  const url =
    WEATHER_API_URL +
    `?lat=${lat}&lon=${lon}&start_date=${start_date}&end_date=${end_date}&key=${process.env.SOLAR_SENSE_WEATHER_API_KEY}`;

  console.log("Weather API called >>>> ", url);

  try {
    const response = await axios.get(url);
    const weatherData = response.data.data;

    const updatedWeatherData = [];
    weatherData.forEach((wData) => {
      const { max_dni, datetime } = wData;
      const electricity = calculateEnergy(wData, area, tilt, orientation, 0.2);

      updatedWeatherData.push({
        irradiance: max_dni,
        date: datetime,
        electricity: electricity,
      });
    });

    return { _id: _id, name: name, data: updatedWeatherData };
  } catch (error) {
    throw new Error(
      `Error retrieving weather data for ${name}:` + error.message
    );
  }
}

const getAllWeatherData = async (locations) => {
  const weatherDataArray = [];
  const { date1: end_date, date2: start_date } = getTodayAndThirtDaysAgo();

  for (const location of locations) {
    const weatherData = await getWeatherData(location, start_date, end_date);
    weatherDataArray.push(weatherData);

    // Delay before making the next request
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return weatherDataArray;
};

const getDailyWeatherData = async (lat, lon, start, end) => {
  try {
    const url =
      WEATHER_API_URL +
      `?lat=${lat}&lon=${lon}&start_date=${start}&end_date=${end}&key=${process.env.SOLAR_SENSE_WEATHER_API_KEY}`;

    console.log("Weather api called >>>>> ", url);
    const response = await axios.get(url);
    const { data } = response.data;

    return data;
  } catch (error) {
    throw new Error("Error fetching location weather report: " + error.message);
  }
};

module.exports = {
  getProductEnergyData,
  getAllWeatherData,
  getDailyWeatherData,
};
