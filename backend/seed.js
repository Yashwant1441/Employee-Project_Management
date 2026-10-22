const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Employee = require("./models/Employee");
const Project = require("./models/Project");
const User = require("./models/User");

// -------------------------------------------------------------
// CLI Argument Parsing
// -------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
        return args[index + 1];
    }
    const eqArg = args.find((a) => a.startsWith(`${flag}=`));
    if (eqArg) {
        return eqArg.split("=")[1];
    }
    return defaultValue;
};

const hasFlag = (flag) => args.includes(flag);

const cleanFlag = hasFlag("--clean") || hasFlag("-c");
const clearOnly = hasFlag("--clear") || hasFlag("--delete-only") || hasFlag("--purge") || hasFlag("--clear-only");
const deleteUser = hasFlag("--delete-user");
const clearAll = hasFlag("--all");
const countArg = parseInt(getArg("--count", "1500"), 10);
const onlyEmployees = hasFlag("--only-employees") || hasFlag("--employees-only");
const onlyProjects = hasFlag("--only-projects") || hasFlag("--projects-only");

let employeeCount = parseInt(getArg("--employees", countArg.toString()), 10);
let projectCount = parseInt(getArg("--projects", countArg.toString()), 10);

if (onlyEmployees) {
    projectCount = 0;
} else if (onlyProjects) {
    employeeCount = 0;
}

const targetEmail = getArg("--email", null);
const targetUserId = getArg("--userId", null);
const batchSize = parseInt(getArg("--batch-size", "500"), 10);

// -------------------------------------------------------------
// Realistic Mock Data Sources
// -------------------------------------------------------------
const FIRST_NAMES = [
    "Aarav", "Aditi", "Alexander", "Amara", "Ananya", "Benjamin", "Chloe", "Daniel",
    "David", "Elena", "Emma", "Ethan", "Fatima", "Gabriel", "Grace", "Hannah",
    "Ishaan", "Jack", "Jacob", "James", "Jasmine", "John", "Kavya", "Leo",
    "Liam", "Lucas", "Maya", "Mia", "Michael", "Neha", "Noah", "Oliver",
    "Olivia", "Priya", "Rahul", "Rohan", "Rohan", "Samantha", "Samuel", "Sarah",
    "Shaun", "Siddharth", "Sophia", "Tara", "Thomas", "Varun", "Vikram", "William",
    "Zara", "Zoe", "Arjun", "Kiran", "Meera", "Ravi", "Dev", "Sunita", "Anil", "Puja"
];

const LAST_NAMES = [
    "Anderson", "Brown", "Chakraborty", "Chen", "Clark", "Davis", "Deshmukh", "Garcia",
    "Gupta", "Harris", "Iyer", "Jackson", "Johnson", "Joshi", "Kapoor", "Khan",
    "Kumar", "Lewis", "Martin", "Mehta", "Miller", "Nair", "Patel", "Rao",
    "Reddy", "Robinson", "Rodriguez", "Roy", "Sharma", "Singh", "Smith", "Taylor",
    "Thomas", "Varma", "Walker", "White", "Williams", "Wilson", "Young", "Zimmerman"
];

const DEPARTMENTS = [
    "Engineering",
    "Frontend Development",
    "Backend Systems",
    "UI/UX Design",
    "Product Management",
    "DevOps & Cloud",
    "Quality Assurance",
    "Data Science & AI",
    "Cybersecurity",
    "Human Resources",
    "Marketing & Growth",
    "Sales & Accounts",
    "Finance & Operations",
    "Customer Success"
];

const CLIENTS = [
    "Acme Global Inc.", "Stripe Financial", "Spotify Media", "Meta Platforms",
    "Tesla Energy", "Shopify Commerce", "Airbnb Travel", "Netflix Streaming",
    "Google Cloud Labs", "Salesforce CRM", "Atlassian Enterprise", "Adobe Creative",
    "Microsoft Azure", "Amazon Web Services", "HubSpot Systems", "Datadog Observability",
    "Snowflake Data", "Twilio Communications", "Dropbox Business", "Slack Technologies",
    "Fintech Horizon", "Nova Healthcare", "Omni Retail", "Vanguard Logistics", "Zenith Capital"
];

const PROJECT_PREFIXES = [
    "Apex", "NextGen", "Nova", "Omni", "Quantum", "Pulse", "Cyber", "Cloud",
    "Echo", "Atlas", "Titan", "Vanguard", "Horizon", "Strata", "Nexus", "Vertex",
    "Aura", "Beacon", "Crest", "Dynasty", "Elevate", "Fortress", "Gateway", "Helix"
];

const PROJECT_DOMAINS = [
    "Enterprise ERP System",
    "Payment Gateway & Ledger",
    "AI Diagnostic Portal",
    "E-Commerce Microservices",
    "Omnichannel CRM Suite",
    "Fleet Tracking & Telematics",
    "Zero-Trust Identity Manager",
    "Real-time Analytics Engine",
    "Supply Chain Orchestrator",
    "Automated HR Onboarding",
    "Fraud Detection Service",
    "Mobile Banking Application",
    "IoT Smart Sensor Dashboard",
    "Customer Self-Service Hub",
    "Cloud Infrastructure Pipeline",
    "Content Distribution Network",
    "Automated Document Classifier",
    "Inventory & Warehouse Portal"
];

const THEMES = [
    "blue", "purple", "emerald", "amber", "rose", "cyan", "indigo", "teal", "violet"
];

const DATABASES = [
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Supabase", "DynamoDB", "Firebase Firestore", "Cassandra"
];

const TECH_LANGUAGES = [
    "React & Node.js",
    "Next.js & TypeScript",
    "Python & FastAPI",
    "Go & Gin",
    "Vue.js & Express",
    "Angular & Spring Boot",
    "Flutter & Node.js",
    "Django & PostgreSQL",
    "Rust & Actix-Web",
    "React Native & GraphQL"
];

const DEPLOYMENT_LOCATIONS = [
    "AWS (us-east-1)",
    "Vercel Edge Network",
    "Google Cloud Platform (GCP)",
    "Render Cloud",
    "DigitalOcean Kubernetes",
    "Microsoft Azure (East US)",
    "Cloudflare Workers",
    "Docker Swarm Cluster"
];

const STATUSES = ["Pending", "In Progress", "Delayed", "Completed"];

const ICONS = ["briefcase", "shield", "rocket", "cpu", "globe", "server", "code", "zap", "database"];

const SAMPLE_UPDATES = [
    { title: "Sprint Kickoff Completed", description: "Completed architecture review and initial backlog grooming.", category: "observation" },
    { title: "Database Migration Successful", description: "Migrated schemas and created compound indexes for performance.", category: "system" },
    { title: "Critical Bug Resolved", description: "Fixed state re-rendering and authentication session refresh edge case.", category: "case" },
    { title: "Client Demo Milestone", description: "Presented phase 1 MVP to client stakeholders with positive feedback.", category: "observation" },
    { title: "Security Audit Passed", description: "Vulnerability scan cleared with zero high-severity CVEs.", category: "system" },
    { title: "Performance Optimization", description: "Implemented server-side pagination and caching for fast load times.", category: "observation" }
];

// -------------------------------------------------------------
// Helper Functions
// -------------------------------------------------------------
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateAvatar = (name) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

// -------------------------------------------------------------
// Main Seeding Routine
// -------------------------------------------------------------
async function runSeed() {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/employeeDB";

    console.log("\n=======================================================");
    console.log("🌱  APEX ENTERPRISE DATABASE SEEDER (1500+ RECORDS)");
    console.log("=======================================================");
    console.log(`🔌 Target MongoDB: ${MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`);

    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Successfully connected to MongoDB Database.\n");

        // 1. Resolve Target User
        let user = null;
        if (targetUserId) {
            user = await User.findById(targetUserId);
        } else if (targetEmail) {
            user = await User.findOne({ email: targetEmail.trim().toLowerCase() });
        }

        if (!user) {
            user = await User.findOne().sort({ createdAt: 1 });
        }

        if (!user) {
            console.log("ℹ️  No existing user accounts found. Creating a default Demo User...");
            const defaultPassword = "admin123";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            user = await User.create({
                email: "admin@apex.com",
                password: hashedPassword,
                customStatuses: ["Pending", "In Progress", "Delayed", "Completed"]
            });
            console.log(`✨ Created Demo User:`);
            console.log(`   📧 Email: admin@apex.com`);
            console.log(`   🔑 Password: ${defaultPassword}\n`);
        } else {
            console.log(`👤 Data will be linked to User:`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🆔 User ID: ${user._id}\n`);
        }

        const userId = user._id;

        // 2. Clean/Delete Data if requested
        if (cleanFlag || clearOnly) {
            if (clearAll) {
                console.log("🧹 Purging all Employees & Projects across the entire database...");
                const deletedEmps = await Employee.deleteMany({});
                const deletedProjs = await Project.deleteMany({});
                console.log(`   🗑️  Deleted ${deletedEmps.deletedCount} employees and ${deletedProjs.deletedCount} projects across all users.\n`);
            } else {
                console.log(`🧹 Purging existing Employees & Projects for user ${user.email}...`);
                const deletedEmps = await Employee.deleteMany({ userId });
                const deletedProjs = await Project.deleteMany({ userId });
                console.log(`   🗑️  Deleted ${deletedEmps.deletedCount} employees and ${deletedProjs.deletedCount} projects for ${user.email}.\n`);
            }

            if (deleteUser) {
                if (clearAll) {
                    const deletedUsers = await User.deleteMany({});
                    console.log(`   🗑️  Deleted ${deletedUsers.deletedCount} user account(s) from database.\n`);
                } else {
                    await User.findByIdAndDelete(userId);
                    console.log(`   🗑️  Deleted user account: ${user.email} (${userId})\n`);
                }
            }

            if (clearOnly) {
                console.log("=======================================================");
                console.log("✨  DATA PURGE COMPLETED SUCCESSFULLY (CLEAN STATE)");
                console.log("=======================================================\n");
                await mongoose.disconnect();
                process.exit(0);
            }
        }

        // 3. Determine Starting Employee ID Number
        let startEmpNumber = 1;
        if (!cleanFlag) {
            const existingEmployees = await Employee.find({ userId }, "employeeId");
            existingEmployees.forEach((emp) => {
                if (emp && emp.employeeId) {
                    const match = String(emp.employeeId).match(/(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (!isNaN(num) && num >= startEmpNumber) {
                            startEmpNumber = num + 1;
                        }
                    }
                }
            });
        }

        // 4. Generate & Bulk Insert Employees
        const startTime = Date.now();
        const generatedEmployees = [];

        if (employeeCount > 0) {
            console.log(`📦 Generating ${employeeCount} realistic Employee records...`);

            for (let i = 0; i < employeeCount; i++) {
                const num = startEmpNumber + i;
                const empId = num < 1000 ? `EMP-${String(num).padStart(3, "0")}` : `EMP-${String(num).padStart(4, "0")}`;
                const firstName = randomItem(FIRST_NAMES);
                const lastName = randomItem(LAST_NAMES);
                const fullName = `${firstName} ${lastName}`;
                const department = randomItem(DEPARTMENTS);
                const avatar = generateAvatar(`${fullName}-${num}`);

                generatedEmployees.push({
                    employeeId: empId,
                    name: fullName,
                    department,
                    avatar,
                    userId
                });
            }

            console.log(`🚀 Inserting ${employeeCount} employees in batches of ${batchSize}...`);
            for (let i = 0; i < generatedEmployees.length; i += batchSize) {
                const chunk = generatedEmployees.slice(i, i + batchSize);
                await Employee.insertMany(chunk, { ordered: false });
                process.stdout.write(`   ✓ Processed ${Math.min(i + chunk.length, generatedEmployees.length)} / ${employeeCount} employees\r`);
            }
            console.log(`\n✅ ${employeeCount} Employees inserted successfully!`);
        } else {
            console.log("⏩ Skipping employee insertion (count is 0 or --only-projects passed).");
        }

        // 5. Generate & Bulk Insert Projects
        const generatedProjects = [];

        if (projectCount > 0) {
            console.log(`\n📦 Generating ${projectCount} realistic Project records...`);

            // Pool of employee names for realistic assignment
            let empNamePool = generatedEmployees.map((e) => e.name);
            if (empNamePool.length === 0) {
                const existing = await Employee.find({ userId }, "name");
                empNamePool = existing.map((e) => e.name);
                if (empNamePool.length === 0) {
                    empNamePool = ["Alex Johnson", "Sarah Connor", "Michael Scott", "David Miller", "Emma Watson"];
                }
            }

        const now = new Date();

        for (let i = 0; i < projectCount; i++) {
            const prefix = randomItem(PROJECT_PREFIXES);
            const domain = randomItem(PROJECT_DOMAINS);
            const projectName = `${prefix} ${domain} ${randomInt(10, 99)}`;
            const clientName = randomItem(CLIENTS);

            // Realistic random dates within a 1-year window
            const startOffsetDays = randomInt(-120, 30);
            const durationDays = randomInt(30, 240);
            const startDate = new Date(now.getTime() + startOffsetDays * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

            // 1 to 4 assigned employees
            const assignedCount = randomInt(1, 4);
            const assignedEmployees = [];
            for (let a = 0; a < assignedCount; a++) {
                const randomEmp = randomItem(empNamePool);
                if (!assignedEmployees.includes(randomEmp)) {
                    assignedEmployees.push(randomEmp);
                }
            }

            // Timely updates
            const numUpdates = randomInt(1, 3);
            const timelyUpdates = [];
            for (let u = 0; u < numUpdates; u++) {
                const sample = randomItem(SAMPLE_UPDATES);
                const daysAgo = randomInt(1, 30);
                const updateDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                timelyUpdates.push({
                    title: sample.title,
                    description: sample.description,
                    category: sample.category,
                    date: updateDate,
                    loggedBy: assignedEmployees[0] || "Project Lead",
                    createdAt: updateDate
                });
            }
            // Sort newest first
            timelyUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));

            const status = randomItem(STATUSES);
            const theme = randomItem(THEMES);
            const database = randomItem(DATABASES);
            const language = randomItem(TECH_LANGUAGES);
            const deploymentLocation = randomItem(DEPLOYMENT_LOCATIONS);
            const allottedHours = randomInt(40, 600);
            const icon = randomItem(ICONS);

            generatedProjects.push({
                name: projectName,
                clientName,
                startDate,
                endDate,
                allottedHours,
                employeeCount: assignedEmployees.length || 1,
                assignedEmployees,
                theme,
                icon,
                database,
                language,
                extraRequirements: `High-availability deployment targeting ${deploymentLocation} with strict SLA monitoring.`,
                deploymentLocation,
                status,
                version: `1.${randomInt(0, 5)}.${randomInt(0, 9)}`,
                documents: [],
                activities: [
                    {
                        fromStatus: "None",
                        toStatus: status,
                        userEmail: user.email,
                        createdAt: startDate
                    }
                ],
                timelyUpdates,
                userId
            });
        }

        console.log(`🚀 Inserting ${projectCount} projects in batches of ${batchSize}...`);
        for (let i = 0; i < generatedProjects.length; i += batchSize) {
            const chunk = generatedProjects.slice(i, i + batchSize);
            await Project.insertMany(chunk, { ordered: false });
            process.stdout.write(`   ✓ Processed ${Math.min(i + chunk.length, generatedProjects.length)} / ${projectCount} projects\r`);
        }
        console.log(`\n✅ ${projectCount} Projects inserted successfully!`);
    } else {
        console.log("⏩ Skipping project insertion (count is 0 or --only-employees passed).");
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

        // 6. Final Database Verification
        const finalEmpCount = await Employee.countDocuments({ userId });
        const finalProjCount = await Project.countDocuments({ userId });

        console.log("\n=======================================================");
        console.log("🎉  SEEDING COMPLETED SUCCESSFULLY!");
        console.log("=======================================================");
        console.log(`⏱️  Total Time Elapsed:     ${totalTime}s`);
        console.log(`👥  Total User Employees:   ${finalEmpCount}`);
        console.log(`📁  Total User Projects:    ${finalProjCount}`);
        console.log(`👤  Linked User:            ${user.email}`);
        console.log("=======================================================\n");

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Seeding failed with error:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

runSeed();
