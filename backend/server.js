require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Employee = require("./models/Employee");
const User = require("./models/User");
const Project = require("./models/Project");
const { requireAuth, JWT_SECRET } = require("./middleware/auth");

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

// Employees API Routes (Protected by JWT requireAuth)
app.get("/api/employees", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const employees = await Employee.find({ userId });
        res.json(employees);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get employees",
            error: error.message
        });
    }
});

app.post("/api/employees", requireAuth, async (req, res) => {
    try {
        let { employeeId, name, department } = req.body;
        const userId = req.userId;

        if (!name || !department) {
            return res.status(400).json({
                message: "Name and Department are required"
            });
        }

        const userEmployees = await Employee.find({ userId });

        const getNextId = () => {
            let maxNum = 0;
            userEmployees.forEach((emp) => {
                if (emp && emp.employeeId) {
                    const match = String(emp.employeeId).match(/(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (!isNaN(num) && num > maxNum) {
                            maxNum = num;
                        }
                    }
                }
            });
            return `EMP-${String(maxNum + 1).padStart(3, "0")}`;
        };

        if (!employeeId) {
            employeeId = getNextId();
        }

        const existingEmployee = await Employee.findOne({ employeeId, userId });
        if (existingEmployee) {
            employeeId = getNextId();
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

app.delete("/api/employees/:id", requireAuth, async (req, res) => {
    try {
        const employee = await Employee.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        if (!employee) {
            return res.status(404).json({
                message: "Employee not found or unauthorized",
            });
        }
        res.json({
            message: "Employee deleted successfully",
            employee: employee
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to Delete employee",
            error: error.message
        });
    }
});

app.put("/api/employees/:id", requireAuth, async (req, res) => {
    try {
        const { employeeId, name, department } = req.body;

        const existingEmployee = await Employee.findOne({
            employeeId,
            userId: req.userId,
            _id: { $ne: req.params.id }
        });
        if (existingEmployee) {
            return res.status(400).json({
                message: `Employee ID "${employeeId}" already exists for another employee.`
            });
        }

        const employee = await Employee.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { employeeId, name, department },
            {
                new: true,
                runValidators: true
            }
        );
        if (!employee) {
            return res.status(404).json({
                message: "Employee not found or unauthorized"
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

// Projects API Routes (Protected by JWT requireAuth)
app.get("/api/projects", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const projects = await Project.find({ userId })
            .select("name clientName startDate endDate allottedHours employeeCount assignedEmployees status")
            .sort({ endDate: 1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch projects",
            error: error.message
        });
    }
});

app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch project details",
            error: error.message
        });
    }
});

app.post("/api/projects", requireAuth, async (req, res) => {
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
        const userId = req.userId;

        if (!name || !clientName) {
            return res.status(400).json({
                message: "Project Name and Client Name are required."
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

app.put("/api/projects/:id", requireAuth, async (req, res) => {
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

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({
            message: "Failed to update project",
            error: error.message
        });
    }
});

app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        if (!project) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }
        res.json({ message: "Project deleted successfully", project });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete project",
            error: error.message
        });
    }
});

// Auth Routes (Login & Signup)
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

        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login Successfully",
            token,
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

        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Account created successfully",
            token,
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