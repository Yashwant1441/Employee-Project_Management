[⬅️ Back to Main README](../README.md)

# 📖 Getting Started Guide

Welcome to the **ApexTech Enterprise Employee & Project Management Portal**. This guide provides an overview of the platform, target audience, core features, and system requirements.

---

## 🎯 Overview & Target Audience

The **ApexTech Enterprise Portal** is an all-in-one resource allocation and project management dashboard engineered for:
- **HR Managers**: Oversee employee lifecycles, auto-generated IDs, department mappings, and custom avatars.
- **Project Managers**: Track project specifications, allocate team members via one-click dropdowns, monitor working hours, and track real-time project statuses.
- **Operations Directors & Executives**: Gain a 360-degree view of company resource utilization, delivery timelines, and client project commitments.

---

## ✨ Core Feature Highlights

### 1. Employee Management
- **Auto-Generated Unique IDs**: Sequential `EMP-XXX` ID generation (`EMP-001`, `EMP-002`) with read-only security enforcement.
- **Multi-Department System**: Department categorization (*Engineering, Design, Operations, Sales, Marketing, HR, Product, QA, Legal, Finance*).
- **Avatar System**: 6 built-in preset avatars plus Cloudinary custom profile picture uploads.

### 2. Project Allocation & Governance
- **Comprehensive Project Specs**: Track Client details, Tech Stack, Primary Database, Versioning (`v1.0.0`), and Target Cloud Deployment.
- **Automated Working Hours Calculator**: Dynamically calculates total available working hours between Start Date and Completion Date while taking holidays and festivals into account.
- **Live Status Tracking Badges**: Real-time project status indicators (`Pending`, `In Progress`, `Completed`, `Delayed`).
- **One-Click Team Allocation**: Easily assign or unassign team members from any project card.
- **Icon Customization**: 20 default preset tech icons plus custom image uploads via Cloudinary.

### 3. Interactive UI & Feedback
- **Automatic Confirmation Pop-ups**: Instant visual dialog pop-ups upon creating/updating employees or projects showing record IDs.
- **Sliding Sheet Drawer Editor**: Sliding side drawers for editing details without navigating away from the dashboard context.
- **Dark Mode & Light Mode**: Built-in theme switcher powered by `next-themes` and Tailwind CSS v4.

### 4. Enterprise Security
- **Bcrypt Password Hashing**: Passwords stored as encrypted bcrypt hashes in MongoDB.
- **JWT Token Authentication**: Encrypted, stateless user sessions with strict multi-tenant data isolation.

---

## ⚙️ System Prerequisites

Before running the application locally or deploying to production, ensure your system has the following software installed:

| Requirement | Recommended Version | Download Link |
| :--- | :--- | :--- |
| **Node.js** | v18.0.0 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0 or higher | (Included with Node.js) |
| **MongoDB** | Community Server 7.0+ or Atlas | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

---

## 📚 Documentation Navigation

- ⚙️ [Installation & Setup Guide](Installation.md)
- 🔒 [Authentication & Security Guide](Authentication.md)
- 📡 [API Endpoints Documentation](API_Documentation.md)
- 🚀 [Deployment Guide](Deployment.md)

[⬅️ Back to Main README](../README.md)
