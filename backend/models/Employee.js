const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
});

employeeSchema.index({ employeeId: 1, userId: 1 }, { unique: true });

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;