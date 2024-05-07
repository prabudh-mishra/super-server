const mongoose = require("mongoose");

const DailyReportSchema = new mongoose.Schema({
  irradiance: {
    type: Number,
    required: [true, "Please add latitude"],
  },
  date: {
    type: String,
    required: true,
  },
  electricity: {
    type: Number,
    required: [true, "Please add latitude"],
  },
});

const productSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add project name"],
    },
    lat: {
      type: Number,
      required: [true, "Please add latitude"],
    },
    lon: {
      type: Number,
      required: [true, "Please add longitude"],
    },
    tilt: {
      type: Number,
      required: [true, "Please add tilt"],
    },
    area: {
      type: Number,
      required: [true, "Please add area"],
    },
    orientation: {
      type: String, // N, S, E, W {try to have enum values}
      required: [true, "Please add an orientation"],
    },
    dailyReport: [DailyReportSchema],
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
