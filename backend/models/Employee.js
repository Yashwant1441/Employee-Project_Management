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

employeeSchema.set("toJSON", {
    transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.userId;
        delete ret.__v;
        return ret;
    }
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;