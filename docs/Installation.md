[⬅️ Back to Main README](../README.md)

# ⚙️ Installation & Setup Guide

This guide walks you through setting up, configuring, and executing the **Employee & Project Management Portal** on your local machine.

---

## 📋 Step-by-Step Setup

### 1. Clone the Repository
Open your terminal and clone the project repository:
```bash
git clone https://github.com/Yashwant1441/Employee-Project_Management.git
cd Employee-Project_Management
```

---

### 2. Environment Configuration
Create a `.env` file inside the `backend/` directory:

```bash
# Navigate to backend directory
cd backend
touch .env
```

Add the following environment variables to `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/employeeDB
JWT_SECRET=your_super_secret_jwt_key_2026
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> 💡 *Note*: If using MongoDB Atlas in the cloud instead of local MongoDB, set `MONGO_URI` to your `mongodb+srv://...` connection string.

---

### 3. Install Dependencies

#### Install Frontend Dependencies
From the project root directory:
```bash
npm install
```

#### Install Backend Dependencies
Navigate to the `backend/` folder and install dependencies:
```bash
cd backend
npm install
cd ..
```

---

### 4. Running the Application Locally

#### Step A: Start Backend Server
```bash
cd backend
node server.js
```
*Backend server runs at `http://localhost:5000`*  
*Output log should state: `Server running on port 5000` & `MongoDB connected`*

#### Step B: Start Frontend Client (in a new terminal)
```bash
# In the root directory
npm run dev
```
*Frontend app runs at `http://localhost:5173`*

---

## 🛠️ Verification & Troubleshooting

- **MongoDB Timeout Error (`buffering timed out after 10000ms`)**: Ensure MongoDB Community Server is installed and running on port 27017 (`Get-Service -Name '*mongo*'`).
- **Cloudinary Upload Error**: Verify that `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are correctly configured in `backend/.env`.

---

## 📚 Documentation Navigation

- 📖 [Getting Started Guide](Getting_Started.md)
- 🔒 [Authentication & Security Guide](Authentication.md)
- 📡 [API Endpoints Documentation](API_Documentation.md)
- 🚀 [Deployment Guide](Deployment.md)

[⬅️ Back to Main README](../README.md)
