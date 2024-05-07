const express = require("express");
const {
  createProject,
  getProjects,
  getProject,
  generateProjectReport,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const {
  createProduct,
  generateProductReport,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { auth } = require("../middlewares/authMiddleware");
const router = express.Router();

// routes for projects
router.post("/", auth, createProject);
router.get("/", auth, getProjects);
router.get("/:id", auth, getProject);
router.post("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);
router.get("/:id/generate-report", auth, generateProjectReport);

// routes for products in project
router.post("/:projectId/products/", auth, createProduct);
router.get("/:projectId/products/:id", auth, getProduct);
router.post("/:projectId/products/:id", auth, updateProduct);
router.delete("/:projectId/products/:id", auth, deleteProduct);

module.exports = router;
