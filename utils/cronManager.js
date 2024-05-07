const cron = require("node-cron");
const { fetchAndGenerateReport } = require("../controllers/projectController");

const cronManager = () => {
  // Schedule a cron at 01:00 am to update data for each projects
  cron.schedule("0 1 * * *", fetchAndGenerateReport);
};

module.exports = cronManager;
