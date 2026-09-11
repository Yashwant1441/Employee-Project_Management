[⬅️ Back to Main README](../README.md)

# 🚀 Deployment Guide

This guide covers deploying the **Employee & Project Management Portal** to production environments across Vercel, Render/Docker, MongoDB Atlas, and GitLab CI/CD pipelines.

---

## 🌐 1. Frontend Deployment (Vercel)

The React 19 + Vite frontend is pre-configured for instant deployment on **Vercel**:

1. Push your code to GitHub/GitLab.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `Employee-Project_Management` repository.
4. Add Environment Variable:
   ```env
   VITE_API_URL=https://your-backend-render-url.onrender.com
   ```
5. Click **Deploy**. Vercel will automatically build and publish your SPA.

---

## 🖥️ 2. Backend Deployment (Render / Docker)

### Deploying to Render
1. Create a new **Web Service** on [Render](https://render.com/).
2. Select your repository and set Root Directory to `backend/`.
3. Set Build Command: `npm install`
4. Set Start Command: `node server.js`
5. Configure Environment Variables:
   - `PORT=5000`
   - `MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/employeeDB`
   - `JWT_SECRET=your_production_secret_key`
   - `CLOUDINARY_CLOUD_NAME=...`
   - `CLOUDINARY_API_KEY=...`
   - `CLOUDINARY_API_SECRET=...`

---

## ⚙️ 3. GitLab CI/CD Automation

The repository includes a pre-configured [.gitlab-ci.yml](../.gitlab-ci.yml) running 3 automated stages:

```yaml
stages:
  - install
  - test
  - build
```

- **`install_job`**: Installs npm packages and caches `node_modules`.
- **`lint_job`**: Audits JavaScript code quality and syntax (`npm run lint`).
- **`build_job`**: Compiles the production bundle (`npm run build`) and saves artifacts (`dist/`).

---

## 📚 Documentation Navigation

- 📖 [Getting Started Guide](Getting_Started.md)
- ⚙️ [Installation Guide](Installation.md)
- 🔒 [Authentication & Security Guide](Authentication.md)
- 📡 [API Endpoints Documentation](API_Documentation.md)

[⬅️ Back to Main README](../README.md)
