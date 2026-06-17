# JanNetra Backend Setup & Documentation 🛠️

This document outlines the architectural setup and configuration requirements for the JanNetra backend environment.

## 🚀 Environment Requirements
- **Node.js**: v18.x or higher (Express 5.x utilized)
- **MongoDB**: Atlas (Cloud) or Local instance
- **Cloudinary**: For media storage (Avatar/Posts)
- **SMTP/Resend**: For transactional emails (OTP/Verification)

## 📦 Core Configuration (.env)
Ensure your `.env` file contains the following variables:
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

EMAIL_HOST=...
EMAIL_PORT=...
EMAIL_USER=...
EMAIL_PASS=...

FRONTEND_URL=http://localhost:5173
```

## 🏗️ Social Ecosystem Logic (Instagram-like)
The backend uses a dual-method approach for social connections:
1.  **Atomic Arrays**: The `User` model maintains `followers` and `following` arrays for rapid indexing and privacy checks.
2.  **Ally Collection**: A dedicated `Ally` model tracks the relationship for complex queries (e.g., "Mutual Allies").

### Privacy Enforcement
- **Public Profile**: All users can view basic info, Voice (posts), and Videos (buzz) of any profile.
- **Strict Privacy**: Identity details (Email, Mobile) and Private content (Saved, Settings, Governance) are stripped from the API response unless the requester is the profile owner.

## 📡 API Routes Reference
### User & Social
- `POST /api/v1/users/toggle-ally/:targetUserId`: Toggle Follow/Unfollow.
- `GET /api/v1/users/profile/:username`: Fetch a public profile with privacy logic.
- `GET /api/v1/users/allies/:userId`: Get list of followers.
- `GET /api/v1/users/champions/:userId`: Get list of following.

## 🛠️ Maintenance & Scaling
- **Indexing**: Always ensure `username`, `email`, and `mobile` are indexed in MongoDB.
- **Audit Logs**: Major actions (Login, Password Reset) are recorded in the `Audit` collection.
- **Validation**: Use the custom `asyncHandler` and `ApiError` utilities for all new controllers to maintain consistency.

---
*Created: June 16, 2026*
*Status: Verified Production Standard*
