const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const Project = require("../models/projectModel");
const { getTodayAndThirtDaysAgo } = require("../utils/dateUtils");
const { getProductEnergyData } = require("../utils/weatherApiManager");

/*
 * @desc    Create Product
 * @route   POST /api/projects/:projectId/products/
 * @access  Private
 */
const createProduct = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  // Check if project exists
  if (!projectId) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Check if project's product limit has been reached
  const existingProducts = await Product.countDocuments({ project: projectId });
  if (existingProducts >= 3) {
    res.status(400);
    throw new Error(
      "Product limit for project has been reached. You cannot create any more products"
    );
  }

  const { name, lat, lon, tilt, orientation, area } = req.body;
  if (!name || !lat || !lon || !tilt || !orientation || !area) {
    res.status(400);
    throw new Error("Please enter all fields");
  }

  const product = await Product.create({
    project: projectId,
    name: name,
    lat: lat,
    lon: lon,
    tilt: tilt,
    orientation: orientation,
    area: area,
  });

  res.status(201).json(product);
});

/*
 * @desc    Get Product details
 * @route   GET /api/projects/:projectId/products/:id
 * @access  Private
 */
const getProduct = asyncHandler(async (req, res) => {
  // Check if project and the product actually exist
  const { projectId, id } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const product = await Product.findById(
    { _id: id, project: projectId },
    { dailyReport: 0 }
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if user has access to the project
  if (req.user.id.toString() !== project.user.toString()) {
    res.status(401);
    throw new Error("User not authorized to access this project");
  }

  res.status(200).json(product);
});

/*
 * @desc    Update Product details
 * @route   POST /api/projects/:projectId/products/:id
 * @access  Private
 */
const updateProduct = asyncHandler(async (req, res) => {
  // Check if project and the product actually exist
  const { projectId, id } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const product = await Product.findById(
    { _id: id, project: projectId },
    { dailyReport: 0 }
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if user has access to the project
  if (req.user.id.toString() !== project.user.toString()) {
    res.status(401);
    throw new Error("User not authorized to access this project");
  }

  // Check if product is already closed
  if (product.isClosed) {
    throw new Error(
      "Product is already closed. You cannot do any more changes to this product."
    );
  }

  const { name, lat, lon, tilt, orientation } = req.body;
  if (!name || !lat || !lon || !tilt || !orientation) {
    res.status(400);
    throw new Error("Please enter all fields");
  }

  const response = await Product.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        project: projectId,
        name: name,
        lat: lat,
        lon: lon,
        tilt: tilt,
        orientation: orientation,
      },
    },
    {
      returnOriginal: false,
      projection: { dailyReport: 0 },
    }
  );

  res.status(200).json(response);
});

/*
 * @desc    Delete Product details
 * @route   DELETE /api/projects/:projectId/products/:id
 * @access  Private
 */
const deleteProduct = asyncHandler(async (req, res) => {
  // Check if project and the product actually exist
  const { projectId, id } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const product = await Product.findById(
    { _id: id, project: projectId },
    { dailyReport: 0 }
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if user has access to the project
  if (req.user.id.toString() !== project.user.toString()) {
    res.status(401);
    throw new Error("User not authorized to access this project");
  }

  const result = await Product.deleteOne({ _id: product._id });
  if (result.deletedCount !== 1) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({ _id: product._id });
});

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
