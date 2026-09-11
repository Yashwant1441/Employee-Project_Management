const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("./models/Employee");
const User = require("./models/User");
const Project = require("./models/Project");
const { requireAuth, JWT_SECRET } = require("./middleware/auth");
const upload = require("./middleware/upload");
const multer = require("multer");
const { uploadStream } = require("./config/cloudinary");

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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("Employee Management Backend API is running successfully!");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is active", timestamp: new Date() });
});

// Self-ping to prevent Render free tier from going to sleep (every 10 minutes)
const RENDER_BACKEND_URL = process.env.RENDER_EXTERNAL_URL || "https://employee-project-management-8wu8.onrender.com";
setInterval(() => {
    fetch(`${RENDER_BACKEND_URL}/health`)
        .then((r) => r.json())
        .then((data) => console.log("Keep-alive ping successful:", data.status))
        .catch((err) => console.log("Keep-alive ping failed:", err.message));
}, 10 * 60 * 1000);


console.log("Connecting to MongoDB:", MONGO_URI ? (MONGO_URI.substring(0, 20) + "...") : "UNDEFINED");
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

// Upload Routes (Multer + Cloudinary)
app.post("/api/upload/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No avatar image file provided." });
        }
        const result = await uploadStream(req.file.buffer, "employee_avatars");
        res.status(200).json({
            message: "Avatar uploaded successfully",
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error) {
        console.error("Cloudinary avatar upload error:", error);
        res.status(500).json({
            message: "Failed to upload avatar to Cloudinary",
            error: error.message,
        });
    }
});

app.post("/api/upload/icon", requireAuth, upload.single("icon"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No icon image file provided." });
        }
        const result = await uploadStream(req.file.buffer, "project_icons");
        res.status(200).json({
            message: "Project icon uploaded successfully",
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error) {
        console.error("Cloudinary project icon upload error:", error);
        res.status(500).json({
            message: "Failed to upload project icon to Cloudinary",
            error: error.message,
        });
    }
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
        let { employeeId, name, department, avatar } = req.body;
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
            avatar: avatar || "",
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
        const { employeeId, name, department, avatar } = req.body;

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
            { employeeId, name, department, avatar: avatar || "" },
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
            .select("name clientName startDate endDate allottedHours employeeCount assignedEmployees status icon theme database language extraRequirements deploymentLocation")
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
            icon,
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
            icon: icon || "",
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
            icon,
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
            icon: icon || "",
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

        // Verify password using bcrypt or fallback for legacy plain-text accounts
        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch && user.password === password) {
            // Legacy account plain-text match: auto-upgrade password to salted bcrypt hash
            isMatch = true;
            user.password = await bcrypt.hash(password, 10);
            await user.save();
        }

        if (!isMatch) {
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

        // Salt and hash user password using bcryptjs
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword
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

// Upload & General Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File size exceeds 5MB limit." });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ message: err.message || "An error occurred during upload." });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});