[⬅️ Back to Main README](../README.md)

# 📡 REST API Documentation

Complete REST API reference for the **ApexTech Enterprise Employee & Project Management Portal**.

---

## 🔐 Authentication Endpoints

### 1. User Registration
- **URL**: `/api/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Account created successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "67cad123abc...",
      "email": "user@example.com"
    }
  }
  ```

---

### 2. User Login
- **URL**: `/api/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Login Successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "67cad123abc...",
      "email": "user@example.com"
    }
  }
  ```

---

## 👤 Employee Endpoints

*(All Employee endpoints require `Authorization: Bearer <token>` header)*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | Fetch all employees belonging to the authenticated user |
| `POST` | `/api/employees` | Create a new employee (Auto-generates `EMP-XXX` ID) |
| `PUT` | `/api/employees/:id` | Update employee details (department, avatar, status) |
| `DELETE` | `/api/employees/:id` | Remove an employee record |
| `POST` | `/api/upload/avatar` | Upload employee profile avatar to Cloudinary |

---

## 📊 Project Endpoints

*(All Project endpoints require `Authorization: Bearer <token>` header)*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | Fetch all active projects belonging to the authenticated user |
| `GET` | `/api/projects/:id` | Fetch specific project details by ID |
| `POST` | `/api/projects` | Create a new project (Auto-calculates hours & assigns auto ID) |
| `PUT` | `/api/projects/:id` | Update project specs, team allocations, or status |
| `DELETE` | `/api/projects/:id` | Remove a project record |
| `POST` | `/api/upload/icon` | Upload custom project icon to Cloudinary |

---

## 📡 Health Check

- **URL**: `/health`
- **Method**: `GET`
- **Response**: `{"status": "ok", "message": "Server is active"}`

---

## 📚 Documentation Navigation

- 📖 [Getting Started Guide](Getting_Started.md)
- ⚙️ [Installation Guide](Installation.md)
- 🔒 [Authentication & Security Guide](Authentication.md)
- 🚀 [Deployment Guide](Deployment.md)

[⬅️ Back to Main README](../README.md)
