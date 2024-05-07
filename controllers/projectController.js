const { format, differenceInDays } = require("date-fns");
const asyncHandler = require("express-async-handler");
const Project = require("../models/projectModel");
const Product = require("../models/productModel");
const { formatDate } = require("../utils/dateUtils");
const { convertJSONToCSV } = require("../utils/fileUtils");
const {
  getAllWeatherData,
  getDailyWeatherData,
} = require("../utils/weatherApiManager");
const { generateMail } = require("../utils/mailServiceManager");
const { calculateEnergy } = require("../utils/energyManager");

/*
 * @desc    Create new project
 * @route   POST /api/projects/
 * @access  Private
 */
const createProject = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error("Please enter project title");
  }

  const project = await Project.create({ name: name, user: req.user.id });
  const projectData = {
    _id: project._id,
    name: project.name,
    isClosed: project.isClosed,
    createdAt: project.createdAt,
    closedAt: project.updatedAt,
    products: [],
  };

  res.status(201).json(projectData);
});

/*
 * @desc    Get all projects created by user
 * @route   GET /api/projects/
 * @access  Private
 */
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user.id });

  res.status(200).json(projects);
});

/*
 * @desc    Get projects details
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProject = asyncHandler(async (req, res) => {
  // Check if project exists
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Check if user allowed to access the project
  if (req.user.id.toString() !== project.user.toString()) {
    res.status(401);
    throw new Error("User not authorized to access this project");
  }

  // Get all products related to the project
  const products = await Product.find({ project: project.id });

  const projectData = {
    _id: project._id,
    name: project.name,
    isClosed: project.isClosed,
    createdAt: project.createdAt,
    closedAt: project.updatedAt,
    products,
  };

  res.status(200).json(projectData);
});

/*
 * @desc    Update project details
 * @route   POST /api/projects/:id
 * @access  Private
 */
const updateProject = asyncHandler(async (req, res) => {
  // Check if project exists
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Check if user allowed to access the project
  if (req.user.id.toString() !== project.user.toString()) {
    res.status(401);
    throw new Error("User not authorized to access this project");
  }

  const projectData = req.body;
  const updatedProject = await Project.findByIdAndUpdate(
    project._id,
    projectData,
    {
      returnOriginal: false,
    }
  );

  const products = await Product.find({ project: updatedProject._id });
  const updatedProjectData = {
    _id: updatedProject._id,
    name: updatedProject.name,
    isClosed: updatedProject.isClosed,
    createdAt: updatedProject.createdAt,
    closedAt: updatedProject.updatedAt,
    products,
  };

  res.status(200).json(updatedProjectData);
});

/*
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = asyncHandler(async (req, res) => {
  // Check if project exists
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Check if user allowed to access the project
  if (req.user.id.toString() !== project.user.toString()) {
    res.status(401);
    throw new Error("User not authorized to access this project");
  }

  // Remove all the products related to the project
  await Product.deleteMany({ project: project._id });
  const result = await Project.deleteOne({ _id: project._id });
  if (result.deletedCount !== 1) {
    res.status(404);
    throw new Error("Project not found");
  }

  res.status(200).json({ _id: project._id });
});

/*
 * @desc    Generate the project report and sends it to the user through email
 * @route   GET /api/projects/:id/generate-report
 * @access  Private
 */
const generateProjectReport = asyncHandler(async (req, res) => {
  // Check if project exists
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Check if user allowed to access the project
  if (req.user.id.toString() !== project.user.toString()) {
    res.status(401);
    throw new Error("User not authorized to access this project");
  }

  // Check if project is already closed
  if (project.isClosed) {
    res.status(400);
    throw new Error(
      "Project is already closed. You cannot generate any more reports"
    );
  }

  const productLocations = await Product.find(
    { project: project._id, isClosed: false },
    { dailyReport: 0 }
  );

  if (productLocations.length === 0) {
    res.status(400);
    throw new Error(
      "There are no product locations. You cannot generate a report"
    );
  }

  // get the energy data for each product over 30 days and generate its CSV file
  const attachmentList = [];
  const weatherDataList = await getAllWeatherData(productLocations);
  weatherDataList.forEach(async (weatherData) => {
    const foldername = project.name;
    const filename = weatherData.name + ".csv";
    const filepath = convertJSONToCSV(weatherData.data, filename, foldername);
    attachmentList.push({ filename: filename, path: filepath });

    // Update product report data and close the product
    await Product.findByIdAndUpdate(weatherData._id, {
      dailyReport: weatherData.data,
      isClosed: true,
    });
  });

  // Send email with the files generated to the user
  const mailOptions = {
    to: req.user.email,
    subject: `Energy Report for ${project.name}`,
    text: `Please find the reports for products in the project ${project.name} in the attachments below`,
    attachments: attachmentList,
  };
  await generateMail(mailOptions);

  // Close the project
  const updatedProject = await Project.findOneAndUpdate(
    project._id,
    { isClosed: true },
    { returnOriginal: false }
  );

  res.status(200).json(updatedProject);
});

/*
 * @desc cron function to get reports and send emails
 */
const fetchAndGenerateReport = async () => {
  // Get all running projects
  const projects = await Project.find({ isClosed: false });

  projects.forEach(async (project) => {
    const diffInDays = differenceInDays(
      new Date(Date.now()),
      new Date(project.createdAt)
    );

    if (diffInDays >= 30) {
      // TODO generate project report and send to client
    }

    // Add daily weather data and electricity calculated in project daily reports
    const products = await Product.find({ project: project._id });
    products.forEach(async (product) => {
      const TODAY = new Date();
      const YESTERDAY = new Date();
      YESTERDAY.setDate(YESTERDAY.getDate() - 1);

      const yesterday = format(YESTERDAY, "yyyy-MM-dd");
      const today = format(TODAY, "yyyy-MM-dd");

      const weatherData = await getDailyWeatherData(
        product.lat,
        product.lon,
        yesterday,
        today
      );

      weatherData.forEach(async (wData) => {
        const energyGenerated = calculateEnergy(
          wData,
          product.area,
          product.tilt,
          product.orientation,
          0.2 // Solar panel yield or efficiency (e.g., 20% efficiency)
        );

        const data = {
          irradiance: wData.max_dni,
          date: wData.datetime,
          electricity: energyGenerated,
        };

        await Product.findByIdAndUpdate(product._id, {
          dailyReport: data,
        });
      });
    });
  });

  console.log("Cron run successful. Data has been updated.");
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  generateProjectReport,
  fetchAndGenerateReport,
};
