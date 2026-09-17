const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    fromStatus: {
      type: String,
      default: "None",
    },
    toStatus: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      default: "System User",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
