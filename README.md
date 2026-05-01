# NeoTravel — User Authentication & Profile Management

A full-stack mobile application built with React Native (Expo) + Node.js + MongoDB.

---

## Project Structure

```
WMT_User_Authentication/
├── 1. UserAuthentication - FrontEnd/   ← React Native (Expo)
└── 2. UserAuthentication - BackEnd/    ← Node.js + Express + MongoDB
```

---

## Backend API

### Auth Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login + get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/resend-verification` | Resend OTP |
| POST | `/api/auth/forgot-password` | Send reset OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### User Endpoints (Protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users/me` | Get current user |
| PATCH | `/api/users/update` | Update profile |
| PATCH | `/api/users/change-password` | Change password |
| PATCH | `/api/users/preferences` | Save preferences |
| GET | `/api/users/login-history` | Get login history |
| DELETE | `/api/users/login-history` | Clear login history |
| PATCH | `/api/users/deactivate` | Deactivate account |
| DELETE | `/api/users/delete` | Delete account |

---

## Running Locally

### Backend
```bash
cd "2. UserAuthentication - BackEnd"
npm install
# Fill in .env (see .env.example)
npm run dev
```

### Frontend
```bash
cd "1. UserAuthentication - FrontEnd"
npm install
# Set EXPO_PUBLIC_API_URL in .env
npx expo start --clear
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/Users
JWT_SECRET=your_secret
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your_refresh_secret
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend `.env`
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
```

---

## Tech Stack
- **Frontend**: React Native, Expo SDK 54, React Navigation, Axios
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Auth**: JWT (access + refresh tokens), bcryptjs
- **Security**: Helmet, express-rate-limit, input validation middleware
- **Email**: Nodemailer (Gmail)
- **Storage**: expo-secure-store (JWT on device)
