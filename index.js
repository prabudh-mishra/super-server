const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");
const cronManager = require("./utils/cronManager");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

connectDB();
cronManager();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));

app.get("/", (req, res) => {
  res.send("API is running in development mode.");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
