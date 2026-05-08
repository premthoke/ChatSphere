<div align="center">
  <img src="https://img.shields.io/badge/ChatSphere-Real--Time-blueviolet?style=for-the-badge&logo=socket.io&logoColor=white" alt="ChatSphere Banner" />
  
  # 💬 ChatSphere

  **A production-ready, highly scalable real-time messaging application built on the MERN stack.**

  [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
</div>

---

## ✨ Features

- **⚡ Real-Time Messaging:** Instant, lag-free communication powered by `Socket.IO`.
- **🔐 Secure Authentication:** JWT-based authentication with encrypted passwords (`bcrypt`).
- **🛡️ Hardened Backend:** Enterprise-grade security featuring HTTP Helmet, rate-limiting, and strict CORS policies.
- **📱 Responsive UI:** A beautifully crafted, mobile-first interface with custom styling.
- **👀 Read Receipts & Status:** Real-time multi-tab synchronized read receipts and user online statuses.
- **🖼️ Media Sharing:** Secure file and avatar upload system handled by `multer`.
- **🚀 Production Ready:** Designed to be easily deployed as a monolith or decoupled (Vercel + Render).

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **State/API:** Axios
- **Real-Time:** Socket.IO Client
- **UI:** Custom CSS, React Hot Toast

### Backend
- **Core:** Node.js, Express.js
- **Database:** MongoDB & Mongoose
- **Real-Time:** Socket.IO
- **Security:** Helmet, Express Rate Limit, CORS
- **Storage:** Multer (Local Storage)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/premthoke/ChatSphere.git
   cd ChatSphere
   ```

2. **Install all dependencies (Frontend & Backend)**
   ```bash
   npm run install:all
   ```

### Configuration

You need to create two environment variable files.

1. **Backend Configuration**
   Create a `.env` file in the **root** directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/chatsphere
   JWT_SECRET=your_super_secret_key_here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   CLIENT_ORIGIN=http://localhost:5173
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   BCRYPT_SALT_ROUNDS=12
   ```

2. **Frontend Configuration**
   Create a `.env` file in the `client/` directory:
   ```env
   VITE_API_URL=/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

---

## 🏃‍♂️ Running the Application

### Development Mode
To run the backend and frontend concurrently (you'll need two terminal tabs):

**Tab 1 (Backend):**
```bash
npm run dev
```

**Tab 2 (Frontend):**
```bash
cd client
npm run dev
```

### Production Build & Run
To compile the frontend and run the application as a unified server:
```bash
npm run build
npm run start:prod
```

---

## 🌐 Deployment

ChatSphere supports both Unified (Monolithic) and Split deployment architectures.

For a detailed breakdown of environment variables and deployment strategies to platforms like **Render**, **Railway**, **Vercel**, or **Heroku**, please refer to the internal deployment documentation or `deployment.md`.

---

## 👨‍💻 Author

**Prem Thoke**

---

<div align="center">
  <i>Built with ❤️ using the MERN Stack</i>
</div>
