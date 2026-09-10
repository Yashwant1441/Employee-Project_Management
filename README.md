# 🚀 Enterprise Employee & Project Management Portal

A full-stack, enterprise-grade web application designed for managing company employees, tracking project allocations, monitoring delivery timelines, and managing resource assignments with real-time popup notifications and Cloudinary media uploads.

---

## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Local Execution](#installation--local-execution)
- [API Documentation](#api-documentation)
- [Git & GitLab Workflow](#git--gitlab-workflow)
- [Deployment](#deployment)

---

## 🌟 Overview
The **ApexTech Enterprise Portal** simplifies HR resource management and project tracking. It features:
- Complete Employee Lifecycle Management (Auto-generated IDs `EMP-001`, Department mapping, Avatar uploads).
- Full Project Allocation Tracking (Client details, Tech Stack, Databases, Status tracking, Allotted Hours).
- Interactive Multi-Select Employee Assignments.
- Cloudinary Integration for high-performance avatar and project icon storage.
- Real-time Instant Feedback & Pop-up Notification Dialogs.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **UI Components**: Radix UI (Dialog, Sheet, Badge, Card, Table)
- **Routing**: React Router DOM v7
- **Themes**: Dark Mode / Light Mode with Next Themes

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT & Bcrypt password hashing
- **Media Storage**: Cloudinary SDK (Direct Cloud Storage)

---

## ✨ Key Features

1. **Auto-Generated Employee IDs**:
   - Automated `EMP-XXX` ID sequence generation (`EMP-001`, `EMP-002`, etc.) with read-only security enforcement.

2. **Smart Project Management**:
   - Track Project Name, Client Name, Start/End Dates, Total Allotted Hours, Tech Stack, Database, and Deployment location.
   - Dynamic calculation of total available working hours based on start and target completion dates.

3. **Collapsible Icon Preset Picker**:
   - Clean, space-saving icon selection picker for project branding with Cloudinary custom image upload capability.

4. **Multi-Select Employee Allocation**:
   - Assign multiple team members to projects with instant filtering and clear visual badges.

5. **Instant Notification Pop-ups**:
   - Instant visual dialog pop-ups whenever an Employee or Project is created or updated, cleanly displaying the respective ID number.

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas URI)

### Environment Configuration

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/employee_project_db
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

### Installation & Local Execution

#### 1. Clone Repository
```bash
git clone https://gitlab.com/your-username/Employee-Project_Management.git
cd Employee-Project_Management
```

#### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3. Start Backend Server
```bash
cd backend
node server.js
```
*Backend runs on `http://localhost:5000`*

#### 4. Start Frontend Client (in a new terminal window)
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📡 API Documentation

### Employee Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | Fetch all registered employees |
| `POST` | `/api/employees` | Create a new employee |
| `PUT` | `/api/employees/:id` | Update employee details |
| `DELETE` | `/api/employees/:id` | Remove an employee |
| `POST` | `/api/upload/avatar` | Upload employee avatar to Cloudinary |

### Project Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | Fetch all active projects |
| `POST` | `/api/projects` | Create a new project |
| `PUT` | `/api/projects/:id` | Update project specification |
| `DELETE` | `/api/projects/:id` | Remove a project |
| `POST` | `/api/upload/icon` | Upload project icon to Cloudinary |

---

## 🔀 Git & GitLab Workflow

We follow the standard **GitLab Flow**:

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Commit & Push**:
   ```bash
   git add .
   git commit -m "Add new feature description"
   git push -u origin feature/your-feature-name
   ```
3. **Open Merge Request (MR)**:
   - Open MR on GitLab targeting `main`.
   - Assign team members for Code Review & Approval.
4. **Merge to Main**:
   - Merge upon approval and CI/CD pipeline verification.

---

## 📄 License
This project is proprietary software for ApexTech Global Enterprise Systems.
