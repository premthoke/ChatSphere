# ChatSphere Deployment Guide 🚀

Follow these steps to deploy ChatSphere to a production environment.

## 1. Backend Deployment (Render / Heroku / Railway)

1. **Environment Variables**: Set all variables listed in `.env.example` in your platform's dashboard.
   - `NODE_ENV=production`
   - `JWT_SECRET`: Generate a strong secret (at least 64 chars).
   - `CLIENT_URL`: Your final frontend URL (e.g. `https://chatsphere.vercel.app`).
   - `MONGO_URI`: Your MongoDB Atlas connection string.

2. **Build Command**: `npm install` (Backend is pure Node.js).
3. **Start Command**: `node server.js`.

---

## 2. Frontend Deployment (Vercel / Netlify)

1. **Environment Variables**:
   - `VITE_API_URL`: Your backend API URL ending in `/api` (e.g. `https://chatsphere-api.onrender.com/api`).
   - `VITE_SOCKET_URL`: Your backend root URL (e.g. `https://chatsphere-api.onrender.com`).

2. **Build Command**: `npm run build` inside the `client` directory.
3. **Output Directory**: `dist`.

---

## 3. Post-Deployment Checks

1. **Health Check**: Visit `https://your-api.com/api/health` to see if it returns `{"status":"ok"}`.
2. **CORS**: Verify that only your frontend can access the API.
3. **Sockets**: Open the browser console on the frontend and ensure there are no "WebSocket connection failed" errors.

## 4. Scalability Notes
- If using multiple backend instances, you must implement a **Redis Adapter** for Socket.IO to synchronize events across servers.
- The current file upload system uses **local storage**. For production, it is highly recommended to migrate to a cloud provider like **AWS S3** or **Cloudinary** for persistence.
