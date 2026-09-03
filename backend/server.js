require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Employee = require("./models/Employee");
const User = require("./models/User");
const Project = require("./models/Project");

const app = express();
app.use(
    cors({
        origin: [
            "https://employee-projectmanagement.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        credentials: true,
    })
);
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("Employee Management Backend API is running successfully!");
});

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected");
        try {
            await Employee.collection.dropIndex("employeeId_1");
            console.log("Legacy employeeId_1 index dropped successfully");
        } catch (e) {
            // Index already dropped or doesn't exist
        }
    })
    .catch((error) => {
        console.log("MongoDB connection failed");
        console.log(error);
    });

app.get("/api/employees", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.json([]);
        }
        const employees = await Employee.find({ userId });
        res.json(employees);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get employees",
            error: error.message
        });
    }
});

app.post("/api/employees", async (req, res) => {
    try {
        const { employeeId, name, department, userId } = req.body;

        if (!employeeId || !name || !department || !userId) {
            return res.status(400).json({
                message: "All fields (Employee ID, Name, Department, User ID) are required"
            });
        }

        const existingEmployee = await Employee.findOne({ employeeId, userId });
        if (existingEmployee) {
            return res.status(400).json({
                message: `Employee ID "${employeeId}" already exists for your account. Please enter a unique Employee ID.`
            });
        }

        const employee = await Employee.create({
            employeeId,
            name,
            department,
            userId
        });
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({
            message: "Failed To Create Employee",
            error: error.message
        });
    }
});

app.delete("/api/employees/:id", async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({
                message: "Employee not found",
            })
        }
        res.json({
            message: "Employee deleted successfully",
            employee: employee
        })
    } catch (error) {
        res.status(500).json({
            message: "Failed to Delete employee",
            error: error.message
        })
    }
});

app.put("/api/employees/:id", async (req, res) => {
    try {
        const { employeeId, name, department } = req.body;

        const existingEmployee = await Employee.findOne({
            employeeId,
            _id: { $ne: req.params.id }
        });
        if (existingEmployee) {
            return res.status(400).json({
                message: `Employee ID "${employeeId}" already exists for another employee.`
            });
        }

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { employeeId, name, department },
            {
                new: true,
                runValidators: true
            }
        );
        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }
        res.json(employee);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: `Employee ID "${req.body.employeeId}" already exists for another employee.`
            });
        }
        res.status(500).json({
            message: "Failed to update employee",
            error: error.message
        });
    }
});

// Projects API Routes
app.get("/api/projects", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.json([]);
        }
        const projects = await Project.find({ userId }).sort({ endDate: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch projects",
            error: error.message
        });
    }
});

app.post("/api/projects", async (req, res) => {
    try {
        const {
            name,
            clientName,
            startDate,
            endDate,
            allottedHours,
            employeeCount,
            assignedEmployees,
            theme,
            database,
            language,
            extraRequirements,
            deploymentLocation,
            status,
            version,
            userId
        } = req.body;

        if (!name || !clientName || !userId) {
            return res.status(400).json({
                message: "Project Name, Client Name, and User ID are required."
            });
        }

        const parsedAssigned = Array.isArray(assignedEmployees)
            ? assignedEmployees
            : (typeof assignedEmployees === 'string' ? assignedEmployees.split(',').map(s => s.trim()).filter(Boolean) : []);

        const project = await Project.create({
            name,
            clientName,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            allottedHours: Number(allottedHours) || 0,
            employeeCount: Number(employeeCount) || parsedAssigned.length || 1,
            assignedEmployees: parsedAssigned,
            theme: theme || "",
            database: database || "",
            language: language || "",
            extraRequirements: extraRequirements || "",
            deploymentLocation: deploymentLocation || "",
            status: status || "In Progress",
            version: version || "1.0.0",
            userId
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({
            message: "Failed to create project",
            error: error.message
        });
    }
});

app.put("/api/projects/:id", async (req, res) => {
    try {
        const {
            name,
            clientName,
            startDate,
            endDate,
            allottedHours,
            employeeCount,
            assignedEmployees,
            theme,
            database,
            language,
            extraRequirements,
            deploymentLocation,
            status,
            version
        } = req.body;

        const parsedAssigned = Array.isArray(assignedEmployees)
            ? assignedEmployees
            : (typeof assignedEmployees === 'string' ? assignedEmployees.split(',').map(s => s.trim()).filter(Boolean) : []);

        const updateData = {
            name,
            clientName,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            allottedHours: Number(allottedHours) || 0,
            employeeCount: Number(employeeCount) || parsedAssigned.length || 1,
            assignedEmployees: parsedAssigned,
            theme: theme || "",
            database: database || "",
            language: language || "",
            extraRequirements: extraRequirements || "",
            deploymentLocation: deploymentLocation || "",
            status: status || "In Progress",
            version: version || "1.0.0"
        };

        const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({
            message: "Failed to update project",
            error: error.message
        });
    }
});

app.delete("/api/projects/:id", async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.json({ message: "Project deleted successfully", project });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete project",
            error: error.message
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login Successfully",
            user: {
                id: user._id.toString(),
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: "Account already exists with this email. Please login."
            });
        }

        const user = await User.create({
            email: normalizedEmail,
            password: password
        });

        res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user._id.toString(),
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create user account",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});