const json2csv = require("json2csv").parse;
const fs = require("fs");
const path = require("path");

const convertJSONToCSV = (data, filename, foldername = "") => {
  // Define the fields and field names for the CSV file
  const fields = ["irradiance", "electricity", "date"];
  const fieldNames = ["Irradiance", "Electricity", "Date"];

  // Define the output directory and path for the CSV file
  const outDir = path.join("./backend/public/files", foldername);
  const outPath = path.join(outDir, filename);

  const csvData = json2csv(data, { fields, fieldNames });

  // If folder do not exist, create one
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFile(outPath, csvData, function (err) {
    if (err) {
      console.error("Error writing CSV file:", err);
    } else {
      console.log("CSV file generated successfully!");
    }
  });

  return outPath;
};

module.exports = {
  convertJSONToCSV,
};
