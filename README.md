<div align="center">

# 💬 ChatSphere

### 🚀 Production-Ready Real-Time Chat Application

A modern, full-stack real-time messaging platform built with the **MERN Stack** and **Socket.IO**, featuring instant messaging, online presence, read receipts, secure authentication, profile management, and production deployment.

<p align="center">
<img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react" />
<img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js" />
<img src="https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express" />
<img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb" />
<img src="https://img.shields.io/badge/Socket.IO-RealTime-010101?style=for-the-badge&logo=socketdotio" />
<img src="https://img.shields.io/badge/Vercel-Frontend-black?style=for-the-badge&logo=vercel" />
<img src="https://img.shields.io/badge/Render-Backend-5A67D8?style=for-the-badge" />
</p>

</div>

---

# 🌐 Live Demo

**Frontend**
https://chat-sphere-sable-sigma.vercel.app

**Backend API**
https://chatsphere-backend-br5t.onrender.com

---

# ✨ Features

## 💬 Messaging

* ⚡ Real-time messaging powered by Socket.IO
* 👀 Live online / offline presence
* ✅ Read receipts (✓ / ✓✓)
* 🔴 Unread message badges
* 🔄 Automatic conversation ordering
* ⚡ Instant sidebar updates
* 🗑️ Real-time message deletion

---

## 👤 User System

* Secure JWT Authentication
* Login & Registration
* Reserved Username System
* Admin Account Seeding
* Profile Photo Upload
* Short Bio
* Edit Profile
* Role-based foundation (User / Admin / Owner)

---

## 📁 File Sharing

* Image Sharing
* Document Sharing
* File Preview
* Download Support
* Production-ready upload architecture

---

## 🔒 Security

* JWT Authentication
* Password Hashing (bcrypt)
* Helmet Security
* Rate Limiting
* Environment Variable Configuration
* Protected Routes
* Secure File Validation

---

## ⚡ Real-Time Engine

* Socket.IO
* Auto Reconnection
* Multi-tab Synchronization
* Read Receipt Synchronization
* Presence Tracking
* Optimistic UI
* Automatic Room Joining
* Background Conversation Updates

---

## 🎨 UI / UX

* Modern Glassmorphism Design
* Dark Theme
* Responsive Layout
* Mobile Friendly
* Animated Status Indicators
* Professional Chat Interface

---

# 📸 Screenshots

> **Login Page**

<img width="1919" height="1079" alt="Screenshot 2026-06-25 132836" src="https://github.com/user-attachments/assets/cd312342-6c2e-4e77-914f-6051a5a063f5" />

---

> **Register Page**

<img width="1919" height="1078" alt="Screenshot 2026-06-25 132820" src="https://github.com/user-attachments/assets/62536d87-eccd-4dbb-b13e-a0892c573f84" />

---

> **Real-Time Chat**

<img width="1919" height="1079" alt="Screenshot 2026-06-25 141302" src="https://github.com/user-attachments/assets/5e55ea56-0161-4626-8edf-668a6c336fe8" />

---

> **Profile Management**

<img width="1917" height="1079" alt="Screenshot 2026-06-25 141327" src="https://github.com/user-attachments/assets/65c9c7e4-0936-4ce4-bb70-3c4bd4adda60" />

---

> **File Sharing**

<img width="1919" height="1079" alt="Screenshot 2026-06-25 141556" src="https://github.com/user-attachments/assets/5a39c5b8-1563-4eba-87f2-2f9499aa3bc5" />

---

> **Responsive Mobile View**

(Ss)

---

# 🏗️ System Architecture

```text
                React + Vite
                      │
                      ▼
            Axios + Socket.IO Client
                      │
                      ▼
             Express.js REST API
                      │
             Socket.IO Server
                      │
                      ▼
               MongoDB Atlas
```

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* Axios
* Socket.IO Client
* CSS3
* Context API

## Backend

* Node.js
* Express.js
* Socket.IO
* JWT
* bcrypt
* Multer
* Express Validator
* Helmet
* Morgan

## Database

* MongoDB Atlas
* Mongoose

## Deployment

* Vercel
* Render

---

# 📂 Project Structure

```text
ChatSphere
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── hooks/
│   └── services/
│
├── server/
│
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── config/
│   ├── utils/
│   └── socket/
│
└── uploads/
```

---

# ⚙️ Run Locally

```bash
git clone https://github.com/premthoke/ChatSphere.git

cd ChatSphere

npm install
```

### Backend

```bash
npm run dev
```

Create `.env`

```env
PORT=5000

MONGO_URI=

JWT_SECRET=

CLIENT_URL=http://localhost:5173

ADMIN_USERNAME=

ADMIN_EMAIL=

ADMIN_PASSWORD=
```

### Frontend

```bash
cd client

npm install

npm run dev
```

Create `.env`

```env
VITE_API_URL=http://localhost:5000/api

VITE_API_BASE=http://localhost:5000

VITE_SOCKET_URL=http://localhost:5000
```

---

# 🚀 Engineering Highlights

* Production Deployment
* Real-Time Socket Architecture
* JWT Authentication
* Conversation Management
* Read Receipt Engine
* Presence Tracking
* Optimistic UI
* Multi-tab Synchronization
* Automatic Admin Seeding
* Production Security Hardening

---

# 🔮 Roadmap

* ☁️ Cloudinary Integration
* 👥 Group Chats
* 😀 Emoji Reactions
* ↩️ Reply to Messages
* 🔔 Push Notifications
* 🎙️ Voice Messages
* 📹 Audio / Video Calling
* 🌍 Message Translation
* 🤖 AI Chat Assistant

---

# 🔐 Security

* No hardcoded credentials
* Environment-based configuration
* Password hashing
* JWT authentication
* Rate limiting
* Helmet security
* Protected API routes

---

# 👨‍💻 Author

**Prem Thoke**

Full Stack Developer

---

# ⭐ Support

If you found this project helpful:

⭐ Star this repository

🍴 Fork it

💡 Suggest improvements

🚀 Build something amazing with it
