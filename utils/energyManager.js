function degrees_to_radians(degrees) {
  return degrees * (Math.PI / 180);
}

const orientationMapping = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

const azimuthMapping = {
  N: 180,
  NNE: 135,
  NE: 90,
  ENE: 45,
  E: 0,
  ESE: 315,
  SE: 270,
  SSE: 225,
  S: 180,
  SSW: 135,
  SW: 90,
  WSW: 45,
  W: 0,
  WNW: 315,
  NW: 270,
  NNW: 225,
};

const calculateEnergy = (weatherData, area, tilt, orientation, efficiency) => {
  const PR = 0.75; // Performance ratio
  const orientationAngle = orientationMapping[orientation];
  const azimuth = azimuthMapping[orientation];
  const radiation = weatherData.solar_rad;

  // Calculate solar radiation
  const irradiation =
    radiation *
    Math.sin(degrees_to_radians(tilt)) *
    Math.cos(degrees_to_radians(azimuth - orientationAngle));

  // Calculate the energy output
  const electricity = Math.abs(area * efficiency * irradiation * PR);

  return electricity;
};

module.exports = { calculateEnergy };
