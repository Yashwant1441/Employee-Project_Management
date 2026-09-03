const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    allottedHours: {
      type: Number,
      default: 0,
    },
    employeeCount: {
      type: Number,
      default: 1,
    },
    assignedEmployees: {
      type: [String],
      default: [],
    },
    theme: {
      type: String,
      default: "",
    },
    database: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
    },
    extraRequirements: {
      type: String,
      default: "",
    },
    deploymentLocation: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Delayed"],
      default: "In Progress",
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
