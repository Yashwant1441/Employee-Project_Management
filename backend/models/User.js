const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    customStatuses: {
        type: [String],
        default: ["Pending", "In Progress", "Delayed", "Completed"]
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;