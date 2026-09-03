// LOCAL BACKEND (Use for local testing)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// RENDER BACKEND (Uncomment when pushing / deploying to Render)
// const API_BASE_URL = import.meta.env.VITE_API_URL || "https://employee-project-management-8wu8.onrender.com";

export default API_BASE_URL;
