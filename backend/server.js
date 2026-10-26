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
const ActivityLog = require("./models/ActivityLog");
const { requireAuth, JWT_SECRET } = require("./middleware/auth");
const upload = require("./middleware/upload");
const documentUpload = require("./middleware/documentUpload");
const multer = require("multer");
const { uploadStream } = require("./config/cloudinary");
const Groq = require("groq-sdk");
const { extractTextFromBuffer } = require("./utils/documentParser");

const app = express();
app.use(
    cors({
        origin: [
            "https://employee-projectmanagement.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "QUERY", "OPTIONS"],
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
        try {
            const now = new Date();
            const projectsWithFutureDates = await Project.find({
                "timelyUpdates.date": { $gt: now }
            });
            for (const proj of projectsWithFutureDates) {
                let modified = false;
                proj.timelyUpdates.forEach((u) => {
                    if (u.date && new Date(u.date) > now) {
                        u.date = new Date(now.getTime() - 86400000 * 2);
                        modified = true;
                    }
                    if (u.createdAt && new Date(u.createdAt) > now) {
                        u.createdAt = new Date(now.getTime() - 86400000 * 2);
                        modified = true;
                    }
                });
                if (modified) {
                    await proj.save();
                }
            }
            if (projectsWithFutureDates.length > 0) {
                console.log(`Cleaned future dates in ${projectsWithFutureDates.length} project(s)`);
            }
        } catch (e) {
            console.error("Cleanup future dates error:", e.message);
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
        const search = req.query.search ? String(req.query.search).trim() : "";
        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        const employees = await Employee.find({ userId }).lean();
        const projects = await Project.find({ userId }, "name assignedEmployees").lean();

        const isAssigned = (proj, emp) => {
            if (!Array.isArray(proj.assignedEmployees)) return false;
            return proj.assignedEmployees.some((item) => {
                if (!item) return false;
                const str = String(item).trim().toLowerCase();
                const empName = emp.name ? String(emp.name).trim().toLowerCase() : "";
                const empId = emp.employeeId ? String(emp.employeeId).trim().toLowerCase() : "";
                return str === empName || str === empId;
            });
        };

        let employeesWithProjects = employees.map((emp) => {
            const assigned = projects
                .filter((proj) => isAssigned(proj, emp))
                .map((proj) => ({
                    id: proj._id ? proj._id.toString() : proj.id,
                    name: proj.name
                }));
            const empObj = {
                ...emp,
                id: emp._id ? emp._id.toString() : emp.id,
                assignedProjects: assigned
            };
            delete empObj._id;
            delete empObj.__v;
            delete empObj.userId;
            return empObj;
        });

        if (search) {
            const searchLower = search.toLowerCase();
            employeesWithProjects = employeesWithProjects.filter((emp) => {
                const nameMatch = emp.name && emp.name.toLowerCase().includes(searchLower);
                const idMatch = emp.employeeId && emp.employeeId.toLowerCase().includes(searchLower);
                const deptMatch = emp.department && emp.department.toLowerCase().includes(searchLower);
                const projMatch = emp.assignedProjects && emp.assignedProjects.some((p) => p.name && p.name.toLowerCase().includes(searchLower));
                return nameMatch || idMatch || deptMatch || projMatch;
            });
        }

        const formattedProjects = projects.map((proj) => {
            const pObj = {
                ...proj,
                id: proj._id ? proj._id.toString() : proj.id
            };
            delete pObj._id;
            delete pObj.__v;
            delete pObj.userId;
            return pObj;
        });

        const totalEmployees = employeesWithProjects.length;

        let resultEmployees = employeesWithProjects;
        let page = 1;
        let limit = totalEmployees || 5;
        let totalPages = 1;

        if (isPaginated) {
            page = Math.max(1, parseInt(req.query.page, 10) || 1);
            limit = Math.max(1, parseInt(req.query.limit, 10) || 5);
            const startIndex = (page - 1) * limit;
            totalPages = Math.ceil(totalEmployees / limit) || 1;
            resultEmployees = employeesWithProjects.slice(startIndex, startIndex + limit);
        }

        res.json({
            employees: resultEmployees,
            pagination: {
                totalEmployees,
                totalPages: isPaginated ? totalPages : (Math.ceil(totalEmployees / 5) || 1),
                currentPage: page,
                limit
            }
        });
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
        res.status(201).json({
            message: "Employee created successfully",
            id: employee._id.toString()
        });
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
            id: req.params.id
            // employee: employee
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
        res.json({
            message: "Employee updated successfully",
            id: req.params.id
        });
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

// HTTP QUERY Route for Employees (RFC 10008) - Read-only with Request Body filters
app.all("/api/employees/query", requireAuth, async (req, res, next) => {
    if (req.method !== "QUERY" && req.method !== "POST") return next();
    try {
        const userId = req.userId;
        const { department, search } = req.body || {};

        const filter = { userId };
        if (department && department !== "All") {
            filter.department = department;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { employeeId: { $regex: search, $options: "i" } },
                { department: { $regex: search, $options: "i" } }
            ];
        }

        const employees = await Employee.find(filter);
        res.setHeader("Accept-Query", "application/json");
        res.json({
            method: req.method,
            count: employees.length,
            employees
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to query employees",
            error: error.message
        });
    }
});

// Projects API Routes (Protected by JWT requireAuth)
// HTTP QUERY Route for Projects (RFC 10008) - Read-only with Request Body filters
app.all("/api/projects/query", requireAuth, async (req, res, next) => {
    if (req.method !== "QUERY" && req.method !== "POST") return next();
    try {
        const userId = req.userId;
        const { status, language, theme, search } = req.body || {};

        const filter = { userId };
        if (status && status !== "All") {
            filter.status = status;
        }
        if (language) {
            filter.language = { $regex: language, $options: "i" };
        }
        if (theme) {
            filter.theme = { $regex: theme, $options: "i" };
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { clientName: { $regex: search, $options: "i" } },
                { database: { $regex: search, $options: "i" } }
            ];
        }

        const projects = await Project.find(filter)
            .select("name clientName startDate endDate allottedHours employeeCount assignedEmployees status icon theme database language extraRequirements deploymentLocation timelyUpdates documents")
            .sort({ endDate: 1 });

        res.setHeader("Accept-Query", "application/json");
        res.json({
            method: req.method,
            count: projects.length,
            projects
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to query projects",
            error: error.message
        });
    }
});

app.get("/api/projects", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const search = req.query.search ? String(req.query.search).trim() : "";
        const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

        let projectFilter = { userId };
        if (search) {
            const searchRegex = new RegExp(search, "i");
            projectFilter.$or = [
                { name: searchRegex },
                { clientName: searchRegex },
                { language: searchRegex },
                { database: searchRegex },
                { deploymentLocation: searchRegex }
            ];
        }

        const totalProjects = await Project.countDocuments(projectFilter);

        let query = Project.find(projectFilter)
            .select("name clientName status icon version allottedHours assignedEmployees employeeCount startDate endDate theme database language extraRequirements deploymentLocation")
            .sort({ createdAt: -1 });

        let page = 1;
        let limit = totalProjects || 6;
        let totalPages = 1;

        if (isPaginated) {
            page = Math.max(1, parseInt(req.query.page, 10) || 1);
            limit = Math.max(1, parseInt(req.query.limit, 10) || 6);
            const skip = (page - 1) * limit;
            totalPages = Math.ceil(totalProjects / limit) || 1;
            query = query.skip(skip).limit(limit);
        }

        const projects = await query;

        const user = await User.findById(userId);
        const defaultStatuses = ["Pending", "In Progress", "Delayed", "Completed"];
        const statuses = (user && user.customStatuses && user.customStatuses.length > 0)
            ? user.customStatuses
            : defaultStatuses;

        res.json({
            projects,
            pagination: {
                totalProjects,
                totalPages: isPaginated ? totalPages : (Math.ceil(totalProjects / 6) || 1)
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch projects",
            error: error.message
        });
    }
});

// GET Dedicated Recent Timely Updates Feed Route (With Server-Side Pagination & Filters)
app.get("/api/projects/recent-updates-feed", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const userObjectId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 4); // Default 4 projects per page

        const search = req.query.search ? String(req.query.search).trim() : "";
        const category = req.query.category || "all";
        const employee = req.query.employee || "all";
        const project = req.query.project || "all";

        const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

        // Base filter for user
        const filter = { userId: userObjectId };
        const andConditions = [];

        // 1. Search Filter
        if (search) {
            const sRegex = new RegExp(escapeRegex(search), "i");
            andConditions.push({
                $or: [
                    { name: sRegex },
                    { clientName: sRegex },
                    { "timelyUpdates.title": sRegex },
                    { "timelyUpdates.description": sRegex },
                    { "timelyUpdates.loggedBy": sRegex }
                ]
            });
        }

        // 2. Category Filter
        if (category && category !== "all") {
            if (category === "no-updates") {
                andConditions.push({
                    $or: [
                        { timelyUpdates: { $size: 0 } },
                        { timelyUpdates: { $exists: false } }
                    ]
                });
            } else {
                const catRegex = new RegExp(`^${escapeRegex(category)}$`, "i");
                andConditions.push({
                    "timelyUpdates.category": catRegex
                });
            }
        }

        // 3. Employee Filter
        if (employee && employee !== "all") {
            const empRegex = new RegExp(escapeRegex(employee), "i");
            andConditions.push({
                $or: [
                    { assignedEmployees: empRegex },
                    { "timelyUpdates.loggedBy": empRegex }
                ]
            });
        }

        // 4. Project Filter
        if (project && project !== "all") {
            if (mongoose.Types.ObjectId.isValid(project)) {
                andConditions.push({
                    _id: new mongoose.Types.ObjectId(project)
                });
            } else {
                andConditions.push({
                    name: project
                });
            }
        }

        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }

        // Total count of matching projects for pagination
        const totalProjects = await Project.countDocuments(filter);
        const totalPages = Math.ceil(totalProjects / limit) || 1;

        // Fetch paginated projects sorted by most recent updates first
        const projects = await Project.aggregate([
            { $match: filter },
            {
                $addFields: {
                    latestUpdateDate: {
                        $ifNull: [
                            { $arrayElemAt: ["$timelyUpdates.date", 0] },
                            { $arrayElemAt: ["$timelyUpdates.createdAt", 0] },
                            null
                        ]
                    },
                    hasUpdates: {
                        $gt: [{ $size: { $ifNull: ["$timelyUpdates", []] } }, 0]
                    }
                }
            },
            {
                $sort: {
                    hasUpdates: -1,
                    latestUpdateDate: -1,
                    updatedAt: -1,
                    createdAt: -1
                }
            },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
                $project: {
                    name: 1,
                    clientName: 1,
                    status: 1,
                    startDate: 1,
                    endDate: 1,
                    assignedEmployees: 1,
                    timelyUpdates: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    version: 1
                }
            }
        ]);

        // Sanitize any accidental future dates
        const now = new Date();
        projects.forEach((p) => {
            if (Array.isArray(p.timelyUpdates)) {
                p.timelyUpdates.forEach((u) => {
                    if (u.date && new Date(u.date) > now) {
                        u.date = new Date(now.getTime() - 86400000 * 2);
                    }
                    if (u.createdAt && new Date(u.createdAt) > now) {
                        u.createdAt = new Date(now.getTime() - 86400000 * 2);
                    }
                });
            }
        });

        // Compute global summary statistics across all user projects
        const statsAgg = await Project.aggregate([
            { $match: { userId: userObjectId } },
            {
                $project: {
                    updateCount: { $size: { $ifNull: ["$timelyUpdates", []] } },
                    hasUpdates: { $gt: [{ $size: { $ifNull: ["$timelyUpdates", []] } }, 0] },
                    latestUpdateDate: { $arrayElemAt: ["$timelyUpdates.date", 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalProjects: { $sum: 1 },
                    projectsWithUpdates: { $sum: { $cond: ["$hasUpdates", 1, 0] } },
                    totalUpdates: { $sum: "$updateCount" },
                    mostRecentDate: { $max: "$latestUpdateDate" }
                }
            }
        ]);

        const stats = {
            totalProjects: statsAgg[0]?.totalProjects || 0,
            projectsWithUpdates: statsAgg[0]?.projectsWithUpdates || 0,
            totalUpdates: statsAgg[0]?.totalUpdates || 0,
            mostRecentDate: statsAgg[0]?.mostRecentDate || null
        };

        // Fetch lightweight project names for filter dropdown
        const allProjects = await Project.find({ userId: userObjectId })
            .select("_id name")
            .sort({ name: 1 })
            .lean();

        const projectOptions = allProjects.map((p) => ({
            id: p._id.toString(),
            name: p.name
        }));

        res.status(200).json({
            projects,
            pagination: {
                totalProjects,
                totalPages,
                currentPage: page,
                limit
            },
            stats,
            projectOptions
        });
    } catch (error) {
        console.error("Recent updates feed error:", error);
        res.status(500).json({ message: "Failed to fetch recent updates feed", error: error.message });
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

        let uEmail = "System User";
        try {
            const u = await User.findById(userId);
            if (u && u.email) uEmail = u.email;
        } catch (e) { }

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
            status: status || "Pending",
            version: version || "1.0.0",
            activities: [
                {
                    fromStatus: "Created",
                    toStatus: status || "Pending",
                    userEmail: uEmail,
                    createdAt: new Date()
                }
            ],
            userId
        });

        res.status(201).json({
            message: "Project created successfully",
            id: project._id.toString()
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create project",
            error: error.message
        });
    }
});

app.put("/api/projects/:id", requireAuth, async (req, res) => {
    try {
        const existingProject = await Project.findOne({ _id: req.params.id, userId: req.userId });
        if (!existingProject) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        const oldStatus = existingProject.status || "Pending";

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
            status: status !== undefined ? status : oldStatus,
            version: version || "1.0.0"
        };

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updateData,
            { new: true, runValidators: true }
        );

        // Record activity directly in Project schema if status changed
        const newStatus = project.status;
        if (oldStatus !== newStatus) {
            try {
                let uEmail = "System User";
                const u = await User.findById(req.userId);
                if (u && u.email) uEmail = u.email;

                project.activities = project.activities || [];
                project.activities.push({
                    fromStatus: oldStatus,
                    toStatus: newStatus,
                    userEmail: uEmail,
                    createdAt: new Date()
                });
                await project.save();
            } catch (e) {
                console.error("Activity log update error:", e.message);
            }
        }

        res.json({
            message: "Project updated successfully",
            id: req.params.id
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update project",
            error: error.message
        });
    }
});

// Lightweight PATCH status endpoint (Drag & drop / Quick status changes)
app.patch("/api/projects/:id/status", requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const existingProject = await Project.findOne({ _id: req.params.id, userId: req.userId });
        if (!existingProject) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        const oldStatus = existingProject.status || "Pending";
        if (oldStatus !== status) {
            existingProject.status = status;

            try {
                let uEmail = "System User";
                const u = await User.findById(req.userId);
                if (u && u.email) uEmail = u.email;

                existingProject.activities = existingProject.activities || [];
                existingProject.activities.push({
                    fromStatus: oldStatus,
                    toStatus: status,
                    userEmail: uEmail,
                    createdAt: new Date()
                });
            } catch (e) {
                console.error("Activity log status update error:", e.message);
            }

            await existingProject.save();
        }

        // Return status & updated activities payload
        res.json({
            id: existingProject._id,
            status: existingProject.status,
            activities: existingProject.activities,
            message: "Status updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update project status",
            error: error.message
        });
    }
});

// Upload documents & folders for a project
app.post("/api/projects/:id/documents", requireAuth, documentUpload.array("files", 20), async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
        if (!project) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No document files provided." });
        }

        let folderPaths = [];
        if (req.body.folderPaths) {
            try {
                folderPaths = typeof req.body.folderPaths === "string"
                    ? JSON.parse(req.body.folderPaths)
                    : req.body.folderPaths;
            } catch (e) {
                folderPaths = [];
            }
        }

        let userEmail = "User";
        try {
            const u = await User.findById(req.userId);
            if (u && u.email) userEmail = u.email;
        } catch (e) { }

        const newDocs = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const rawPath = (Array.isArray(folderPaths) ? folderPaths[i] : "/") || "/";
            const normalizedPath = rawPath.startsWith("/") ? rawPath : "/" + rawPath;

            const uploadRes = await uploadStream(file.buffer, "project_documents");
            const ext = file.originalname.split(".").pop().toLowerCase();
            let extractedText = "";
            try {
                extractedText = await extractTextFromBuffer(file.buffer, file.originalname);
            } catch (err) {
                console.error("Text extraction warning:", err.message);
            }

            newDocs.push({
                name: file.originalname,
                fileUrl: uploadRes.secure_url,
                fileType: ext,
                size: file.size,
                folderPath: normalizedPath,
                public_id: uploadRes.public_id,
                uploadedBy: userEmail,
                uploadedAt: new Date(),
                extractedText: extractedText || "",
            });
        }

        if (!project.documents) {
            project.documents = [];
        }
        project.documents.push(...newDocs);

        if (!project.timelyUpdates) {
            project.timelyUpdates = [];
        }
        project.timelyUpdates.unshift({
            title: `Uploaded ${newDocs.length} Document(s)`,
            description: `Attached files: ${newDocs.map(d => d.name).join(", ")}`,
            category: "system",
            date: new Date(),
            loggedBy: userEmail,
            createdAt: new Date()
        });

        await project.save();

        res.status(200).json({
            message: "Documents uploaded successfully",
            documents: project.documents,
        });
    } catch (error) {
        console.error("Document upload error:", error);
        res.status(500).json({
            message: "Failed to upload project documents",
            error: error.message,
        });
    }
});

// Delete a document from a project
app.delete("/api/projects/:id/documents/:docId", requireAuth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
        if (!project) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        project.documents = (project.documents || []).filter(
            (doc) => String(doc._id || doc.id) !== String(req.params.docId)
        );
        await project.save();

        res.status(200).json({
            message: "Document deleted successfully",
            documents: project.documents,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete document",
            error: error.message,
        });
    }
});

// GET Timely Updates (Observations & Cases) for a project
app.get("/api/projects/:id/timely-updates", requireAuth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
        if (!project) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }
        res.status(200).json({
            timelyUpdates: project.timelyUpdates || []
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch timely updates", error: error.message });
    }
});

// POST a new Timely Update (Observation / Case) for a project
app.post("/api/projects/:id/timely-updates", requireAuth, async (req, res) => {
    try {
        const { title, description, category, date } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required for timely update." });
        }

        const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
        if (!project) {
            return res.status(404).json({ message: "Project not found or unauthorized" });
        }

        let userEmail = "User";
        try {
            const u = await User.findById(req.userId);
            if (u && u.email) userEmail = u.email;
        } catch (e) { }

        if (!project.timelyUpdates) {
            project.timelyUpdates = [];
        }

        const now = new Date();
        let updateDate = now;
        if (date) {
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) {
                parsed.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                updateDate = parsed;
            }
        }

        const newUpdate = {
            title: title.trim(),
            description: (description || "").trim(),
            category: category || "observation",
            date: updateDate,
            loggedBy: userEmail,
            createdAt: now
        };

        project.timelyUpdates.unshift(newUpdate);
        await project.save();

        res.status(201).json({
            message: "Timely update logged successfully",
            timelyUpdates: project.timelyUpdates
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to log timely update", error: error.message });
    }
});

// GET project activity logs
app.get("/api/projects/:id/activities", requireAuth, async (req, res) => {
    try {
        const activities = await ActivityLog.find({
            projectId: req.params.id,
            userId: req.userId
        }).sort({ createdAt: -1 });

        res.json(activities);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch project activity logs",
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
        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete project",
            error: error.message
        });
    }
});

// GET active user custom statuses
app.get("/api/statuses", requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const defaultStatuses = ["Pending", "In Progress", "Delayed", "Completed"];
        if (!user || !user.customStatuses || user.customStatuses.length === 0) {
            return res.json(defaultStatuses);
        }
        res.json(user.customStatuses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch statuses", error: error.message });
    }
});

// POST add a new custom status column
app.post("/api/statuses", requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Status name is required" });
        }
        const trimmedName = name.trim();
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const currentStatuses = user.customStatuses && user.customStatuses.length > 0
            ? user.customStatuses
            : ["Pending", "In Progress", "Delayed", "Completed"];

        if (currentStatuses.includes(trimmedName)) {
            return res.status(400).json({ message: "Status already exists" });
        }

        user.customStatuses = [...currentStatuses, trimmedName];
        await user.save();

        res.json({ message: "Status added successfully", statuses: user.customStatuses });
    } catch (error) {
        res.status(500).json({ message: "Failed to add status", error: error.message });
    }
});

// DELETE a status column (reassigning existing projects)
app.delete("/api/statuses/:name", requireAuth, async (req, res) => {
    try {
        const statusToDelete = decodeURIComponent(req.params.name);
        const { targetStatus } = req.body || {};

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const currentStatuses = user.customStatuses && user.customStatuses.length > 0
            ? user.customStatuses
            : ["Pending", "In Progress", "Delayed", "Completed"];

        if (currentStatuses.length <= 1) {
            return res.status(400).json({ message: "Cannot delete the last remaining status column." });
        }

        // Filter out status to delete
        user.customStatuses = currentStatuses.filter((s) => s !== statusToDelete);
        await user.save();

        // Reassign affected projects to targetStatus or fallback
        const fallbackStatus = targetStatus || user.customStatuses[0] || "Pending";
        await Project.updateMany(
            { userId: req.userId, status: statusToDelete },
            { $set: { status: fallbackStatus } }
        );

        res.json({
            message: "Status deleted successfully",
            statuses: user.customStatuses,
            reassignedTo: fallbackStatus
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete status", error: error.message });
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

        const totalEmployees = await Employee.countDocuments({ userId: user._id });
        const totalProjects = await Project.countDocuments({ userId: user._id });

        res.json({
            message: "Login Successfully",
            token,
            user: {
                id: user._id.toString(),
                email: user.email
            },
            counts: {
                totalEmployees,
                totalProjects
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
            },
            counts: {
                totalEmployees: 0,
                totalProjects: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create user account",
            error: error.message
        });
    }
});

// AI Chatbot Conversational Assistant Route (Groq API - Full Workspace Context-Aware & Compact)
app.post("/api/chat", requireAuth, async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: "Messages array is required." });
        }

        const userId = req.userId || req.user?.userId;
        let empSummaryText = "No employee records found.";
        let projSummaryText = "No project records found.";
        let totalEmployees = 0;
        let totalProjects = 0;

        const now = new Date();
        const currentDateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        if (userId) {
            try {
                const userEmployees = await Employee.find({ userId })
                    .select("employeeId name department")
                    .lean();

                const userProjects = await Project.find({ userId })
                    .select("name clientName status allottedHours assignedEmployees database language theme deploymentLocation extraRequirements startDate endDate documents timelyUpdates")
                    .lean();

                totalEmployees = userEmployees.length;
                totalProjects = userProjects.length;

                if (userEmployees.length > 0) {
                    empSummaryText = userEmployees.map(e =>
                        `- Name: ${e.name} | ID: ${e.employeeId} | Dept: ${e.department}`
                    ).join("\n");
                }

                if (userProjects.length > 0) {
                    for (const p of userProjects) {
                        if (Array.isArray(p.documents) && p.documents.length > 0) {
                            for (const d of p.documents) {
                                if (!d.extractedText || d.extractedText.length < 1000) {
                                    if (d.fileUrl) {
                                        try {
                                            const resp = await fetch(d.fileUrl);
                                            if (resp.ok) {
                                                const arrayBuf = await resp.arrayBuffer();
                                                const buf = Buffer.from(arrayBuf);
                                                const fullText = await extractTextFromBuffer(buf, d.name);
                                                if (fullText && fullText.length > (d.extractedText || "").length) {
                                                    d.extractedText = fullText;
                                                    Project.updateOne(
                                                        { _id: p._id, "documents._id": d._id },
                                                        { $set: { "documents.$.extractedText": fullText } }
                                                    ).exec().catch(() => { });
                                                }
                                            }
                                        } catch (err) {
                                            console.error("On-the-fly document fetch warning:", err.message);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    projSummaryText = userProjects.map(p => {
                        const assignedStr = Array.isArray(p.assignedEmployees) && p.assignedEmployees.length > 0
                            ? p.assignedEmployees.join(", ")
                            : "None";
                        const startDateObj = p.startDate ? new Date(p.startDate) : null;
                        const endDateObj = p.endDate ? new Date(p.endDate) : null;
                        const startStr = startDateObj ? startDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A";
                        const endStr = endDateObj ? endDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A";

                        let timelineAnalysis = "";
                        if (startDateObj && endDateObj) {
                            const totalDurationDays = Math.max(1, Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)));
                            const daysPassed = Math.max(0, Math.floor((now - startDateObj) / (1000 * 60 * 60 * 24)));
                            const daysRemaining = Math.max(0, Math.ceil((endDateObj - now) / (1000 * 60 * 60 * 24)));
                            const totalHours = p.allottedHours || 0;

                            const timeElapsedFraction = Math.min(1, Math.max(0, daysPassed / totalDurationDays));
                            const estRemainingHours = Math.round(totalHours * (1 - timeElapsedFraction));

                            timelineAnalysis = ` | Total Duration: ${totalDurationDays} days | Days Remaining: ${daysRemaining} days | Est. Remaining Hours (Schedule-based): ~${estRemainingHours} hours (out of ${totalHours} hrs)`;
                        }

                        let docsAnalysis = "None";
                        let folderTreeAnalysis = "None";

                        if (Array.isArray(p.documents) && p.documents.length > 0) {
                            const folderGroups = {};
                            p.documents.forEach(d => {
                                const folderName = (d.folderPath && d.folderPath !== "/") ? d.folderPath : "/ (Root Directory)";
                                if (!folderGroups[folderName]) folderGroups[folderName] = [];
                                folderGroups[folderName].push(d.name);
                            });

                            folderTreeAnalysis = Object.keys(folderGroups).map(f => {
                                return `Folder "${f}": ${folderGroups[f].length} file(s) [${folderGroups[f].join(", ")}]`;
                            }).join("; ");

                            docsAnalysis = p.documents.map(d => {
                                const folderLoc = (d.folderPath && d.folderPath !== "/") ? ` [Folder: "${d.folderPath}"]` : " [Folder: Root /]";
                                const textContent = d.extractedText
                                    ? `\n  - Document Content ("${d.name}" in ${folderLoc}): """${d.extractedText.substring(0, 6000)}"""`
                                    : "";
                                return `[File: "${d.name}"${folderLoc}, Type: ${d.fileType || 'file'}${textContent}]`;
                            }).join("\n  ");
                        }

                        let updatesAnalysis = "No timely updates logged yet.";
                        if (Array.isArray(p.timelyUpdates) && p.timelyUpdates.length > 0) {
                            updatesAnalysis = p.timelyUpdates.map(u => {
                                const dateStr = u.date ? new Date(u.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                                const descStr = u.description ? ` - Details: ${u.description}` : '';
                                return `[${(u.category || 'observation').toUpperCase()}: "${u.title}" | Date: ${dateStr} | Logged by: ${u.loggedBy || 'User'}${descStr}]`;
                            }).join("\n    ");
                        }

                        return `- Project: "${p.name}" | Client: ${p.clientName} | Status: ${p.status || 'Pending'} | Total Allotted Hours: ${p.allottedHours || 0}${timelineAnalysis} | Theme: ${p.theme || 'Default'} | Deployment Location: ${p.deploymentLocation || 'Not Specified'} | Language: ${p.language || 'N/A'} | Database: ${p.database || 'N/A'} | Extra Reqs: ${p.extraRequirements || 'None'} | Timeline: ${startStr} to ${endStr} | Team Assigned: ${assignedStr}\n  - Timely Updates (Observations & Cases):\n    ${updatesAnalysis}\n  - Uploaded Folder Structure: ${folderTreeAnalysis}\n  - Attached Project Documents & Files:\n  ${docsAnalysis}`;
                    }).join("\n");
                }
            } catch (e) { }
        }

        const systemPrompt = {
            role: "system",
            content: `You are an intelligent, polite, and helpful AI Assistant for the Employee & Project Management Portal (Apex System).

CURRENT SYSTEM DATE: ${currentDateStr} (${now.toISOString().split('T')[0]})

LIVE WORKSPACE SNAPSHOT (Real-Time Database Context for this user):

📊 TOTAL COUNTS:
- Total Employees: ${totalEmployees}
- Total Projects: ${totalProjects}

👥 EMPLOYEE DIRECTORY:
${empSummaryText}

📁 PROJECT PORTFOLIO:
${projSummaryText}

STRICT INSTRUCTIONS FOR ANSWERS:
1. Use the LIVE WORKSPACE SNAPSHOT above to answer ANY questions about project details, client names, project statuses, tech stacks, assigned team members, employee details, department counts, timelines, remaining hours, or uploaded project documents/files.
2. When asked about "remaining hours", "time left", "days left", or schedule estimations:
   - Use the CURRENT SYSTEM DATE (${currentDateStr}) and compare it against the project's start date and end date.
   - Explain the remaining days until project deadline and compute the estimated remaining hours out of total allotted hours based on time passed vs deadline. ALWAYS calculate it clearly!
3. When asked about uploaded project documents, files, folders, data tables, or images:
   - Check the "Uploaded Folder Structure" and "Folder Location" for each document in the snapshot.
   - Answer questions about which folders exist, how many files are inside each folder (e.g., 2 PDFs in a folder), and summarize/read the contents of all files inside those folders.
   - Read and report exact data from tables (e.g. Team Members, Quarterly Financials, Scores, Revenue, Profit), section details, and image/figure counts.
4. When reporting table rows or multiple data items, format each item on a NEW bullet point line (one line per row/item). NEVER join multiple table rows into one single continuous horizontal line!
5. Always keep your responses VERY COMPACT, direct, and concise (maximum 2-4 short bullet points or 1-2 brief sentences).
6. Avoid writing long paragraphs, disclaimers, lengthy step-by-step guides, or tables unless explicitly requested.
7. Keep the tone helpful, professional, and straight to the point.`
        };

        const groqMessages = [systemPrompt, ...messages];
        const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const completion = await groqClient.chat.completions.create({
            messages: groqMessages,
            model: "openai/gpt-oss-120b",
            temperature: 0.7,
            max_completion_tokens: 512,
        });

        const reply = completion.choices[0]?.message?.content || "I couldn't process your request right now.";

        res.status(200).json({ reply });
    } catch (error) {
        console.error("Groq Conversational Chat Error:", error);
        res.status(500).json({
            message: "Failed to communicate with AI Assistant.",
            error: error.message
        });
    }
});

// =========================================================================
// Dedicated High-Performance Analytics Aggregation Pipeline (RFC Aggregations)
// =========================================================================
app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const userObjectId = mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const userMatch = {
            $or: [
                { userId: userObjectId },
                { userId: String(userId) }
            ]
        };

        const today = new Date();

        // Run both Project and Employee aggregations in parallel inside MongoDB C++ Engine
        const [projectAggResult, employeeAggResult] = await Promise.all([
            Project.aggregate([
                { $match: userMatch },
                {
                    $facet: {
                        statusSummary: [
                            {
                                $group: {
                                    _id: "$status",
                                    count: { $sum: 1 },
                                    hours: { $sum: "$allottedHours" }
                                }
                            }
                        ],
                        overdueStats: [
                            {
                                $match: {
                                    endDate: { $lt: today },
                                    status: { $ne: "Completed" }
                                }
                            },
                            { $count: "count" }
                        ],
                        languages: [
                            { $match: { language: { $exists: true, $ne: "" } } },
                            { $group: { _id: "$language", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 8 }
                        ],
                        databases: [
                            { $match: { database: { $exists: true, $ne: "" } } },
                            { $group: { _id: "$database", count: { $sum: 1 } } },
                            { $sort: { count: -1 } },
                            { $limit: 8 }
                        ],
                        topHoursProjects: [
                            { $match: { allottedHours: { $gt: 0 } } },
                            { $sort: { allottedHours: -1 } },
                            { $limit: 6 },
                            {
                                $project: {
                                    name: 1,
                                    clientName: 1,
                                    status: 1,
                                    allottedHours: 1
                                }
                            }
                        ],
                        assignedBreakdown: [
                            { $unwind: "$assignedEmployees" },
                            { $match: { assignedEmployees: { $exists: true, $ne: "" } } },
                            {
                                $group: {
                                    _id: { $toLower: "$assignedEmployees" },
                                    rawName: { $first: "$assignedEmployees" },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ]),
            Employee.aggregate([
                { $match: userMatch },
                {
                    $facet: {
                        departments: [
                            {
                                $group: {
                                    _id: { $ifNull: ["$department", "Unassigned"] },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } }
                        ],
                        allEmployees: [
                            {
                                $project: {
                                    name: 1,
                                    employeeId: 1,
                                    department: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                }
            ])
        ]);

        const pData = projectAggResult[0] || {};
        const eData = employeeAggResult[0] || {};

        // Calculate Project Status Totals & Hours
        let totalProjects = 0;
        let totalAllottedHours = 0;
        let completedCount = 0;
        let inProgressCount = 0;
        let pendingCount = 0;
        let delayedCount = 0;

        const statusCounts = {};
        (pData.statusSummary || []).forEach((item) => {
            const name = item._id ? String(item._id).trim() : "Pending";
            const cnt = Number(item.count) || 0;
            const hrs = Number(item.hours) || 0;

            totalProjects += cnt;
            totalAllottedHours += hrs;
            statusCounts[name] = (statusCounts[name] || 0) + cnt;

            const lower = name.toLowerCase();
            if (lower === "completed") completedCount += cnt;
            else if (lower === "in progress") inProgressCount += cnt;
            else if (lower === "delayed") delayedCount += cnt;
            else pendingCount += cnt;
        });

        const overdueCount = pData.overdueStats?.[0]?.count || 0;

        // Assigned Workforce Mapping
        const assignmentMap = new Map();
        (pData.assignedBreakdown || []).forEach((item) => {
            if (item && item._id) {
                assignmentMap.set(String(item._id).trim().toLowerCase(), item.count || 0);
            }
        });

        // Parse Employees & Cross-reference Project Assignment
        const allEmployeesList = eData.allEmployees || [];
        const totalEmployees = allEmployeesList.length;

        let assignedCount = 0;
        const employeeWorkloads = allEmployeesList.map((emp) => {
            const nameKey = String(emp.name || "").trim().toLowerCase();
            const idKey = String(emp.employeeId || "").trim().toLowerCase();
            const assigned = assignmentMap.get(nameKey) || assignmentMap.get(idKey) || 0;
            if (assigned > 0) assignedCount++;

            return {
                id: emp._id ? emp._id.toString() : emp.id,
                name: emp.name,
                employeeId: emp.employeeId,
                department: emp.department || "General",
                avatar: emp.avatar || "",
                assignedCount: assigned
            };
        });

        employeeWorkloads.sort((a, b) => b.assignedCount - a.assignedCount);
        const topContributors = employeeWorkloads.slice(0, 5);
        const unassignedEmployees = employeeWorkloads.filter((e) => e.assignedCount === 0).slice(0, 6);

        // KPI Rates
        const completionRate = totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0;
        const utilizationRate = totalEmployees > 0 ? Math.round((assignedCount / totalEmployees) * 100) : 0;
        const avgHours = totalProjects > 0 ? Math.round(totalAllottedHours / totalProjects) : 0;

        // Department Headcount
        const departmentChartData = (eData.departments || []).map((d) => ({
            name: d._id || "Unassigned",
            count: d.count
        }));

        // Status Chart Data
        const statusChartData = Object.keys(statusCounts).map((key) => ({
            name: key,
            value: statusCounts[key],
            percentage: totalProjects > 0 ? Math.round((statusCounts[key] / totalProjects) * 100) : 0
        }));

        // Languages & Databases
        const languageChartData = (pData.languages || []).map((l) => ({
            name: l._id,
            count: l.count
        }));

        const databaseChartData = (pData.databases || []).map((db) => ({
            name: db._id,
            count: db.count
        }));

        // Top Hours Projects
        const topHoursProjects = (pData.topHoursProjects || []).map((p) => ({
            name: p.name && p.name.length > 18 ? p.name.slice(0, 16) + "…" : (p.name || "Untitled"),
            fullName: p.name,
            hours: Number(p.allottedHours) || 0,
            status: p.status || "Pending",
            client: p.clientName || "Direct"
        }));

        res.json({
            kpis: {
                totalProj: totalProjects,
                totalEmp: totalEmployees,
                completedCount,
                inProgressCount,
                pendingCount,
                delayedCount,
                totalAllottedHours,
                overdueCount,
                assignedEmpCount: assignedCount,
                unassignedEmpCount: Math.max(0, totalEmployees - assignedCount),
                completionRate,
                utilizationRate,
                avgHours
            },
            statusChartData,
            departmentChartData,
            languageChartData,
            databaseChartData,
            topHoursProjects,
            topContributors,
            unassignedEmployees,
            uniqueStatuses: Object.keys(statusCounts).sort(),
            uniqueDepartments: departmentChartData.map((d) => d.name).sort()
        });
    } catch (error) {
        console.error("Analytics Aggregation Error:", error);
        res.status(500).json({
            message: "Failed to generate analytics aggregation",
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