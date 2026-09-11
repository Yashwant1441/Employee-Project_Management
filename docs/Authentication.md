[⬅️ Back to Main README](../README.md)

# 🔒 Authentication & Security Architecture

The **ApexTech Enterprise Portal** implements bank-grade, multi-layered security to ensure user data isolation, password safety, and protected API access.

---

## 🔑 Core Security Components

### 1. Bcrypt Password Hashing (`bcryptjs`)
- **Zero Plain-Text Passwords**: All user passwords are encrypted using `bcryptjs` before being saved to MongoDB.
- **Random Salting**: Each password is combined with a random 22-character salt before hashing, protecting against pre-computed Rainbow Table attacks.
- **Cost Factor (10 Rounds)**: Sets the key stretching iterations to $2^{10} = 1024$ rounds, rendering brute-force attacks computationally unfeasible (~100+ years per password).

```javascript
// Password Hashing on Registration
const hashedPassword = await bcrypt.hash(password, 10);
const user = await User.create({ email, password: hashedPassword });

// Password Verification on Login
const isMatch = await bcrypt.compare(enteredPassword, user.password);
```

---

### 2. JWT (JSON Web Token) Session Management
- **Stateless Bearer Tokens**: Upon successful authentication (`/api/login`), the backend generates a signed JWT token valid for 7 days.
- **Header Structure**: Clients attach the token to the HTTP `Authorization` header on all protected API requests:
  ```http
  Authorization: Bearer <your_jwt_token_here>
  ```
- **Token Verification Middleware**: [`backend/middleware/auth.js`](../backend/middleware/auth.js) intercepts incoming requests, verifies the JWT signature against `JWT_SECRET`, and extracts the `req.userId`.

---

### 3. Multi-Tenant User Isolation
- **Data Privacy Guarantee**: Every employee and project document in MongoDB is scoped to a specific user (`userId`).
- **Compound Indexing**: MongoDB compound index (`{ employeeId: 1, userId: 1 }`) ensures users can strictly view and edit only their own organization's records.

---

## 🔒 Security Summary Table

| Security Feature | Implementation | Purpose |
| :--- | :--- | :--- |
| **Password Storage** | `bcryptjs` (10 Salt Rounds) | Prevents plain-text password exposure |
| **Session Security** | JWT Bearer Tokens (`jsonwebtoken`) | Encrypted, stateless session verification |
| **Route Protection** | `requireAuth` Express Middleware | Rejects unauthorized HTTP requests (401) |
| **Data Isolation** | `{ userId: req.userId }` scoping | Prevents cross-account data leaks |

---

## 📚 Documentation Navigation

- 📖 [Getting Started Guide](Getting_Started.md)
- ⚙️ [Installation Guide](Installation.md)
- 📡 [API Endpoints Documentation](API_Documentation.md)
- 🚀 [Deployment Guide](Deployment.md)

[⬅️ Back to Main README](../README.md)
