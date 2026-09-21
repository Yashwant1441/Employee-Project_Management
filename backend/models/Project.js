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
    icon: {
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
      default: "",
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    documents: [
      {
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, default: "" },
        size: { type: Number, default: 0 },
        folderPath: { type: String, default: "/" },
        public_id: { type: String, default: "" },
        uploadedBy: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    activities: [
      {
        fromStatus: { type: String, default: "" },
        toStatus: { type: String, default: "" },
        userEmail: { type: String, default: "System User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

projectSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.userId;
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.version;
    return ret;
  }
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
