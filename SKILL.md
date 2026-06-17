# JanNetra Pro: Technical Mastery & Documentation

This document serves as the authoritative source for technical architecture, development protocols, and the progress record for the **JanNetra** platform.

---

## 🌟 Platform Vision
A social + governance platform where citizens can explore India from national level to village level, stay informed, share updates, discover government schemes, follow development projects, and connect with communities.

### 🎨 Theme & UX Goals
- **Modern & Professional:** Clean, high-end GovTech aesthetic.
- **Social Integration:** Instagram + LinkedIn inspired interactions.
- **Governance Focused:** Tracking leaders, schemes, and infrastructure.
- **Mobile-First:** Fully responsive and optimized for mobile users.
- **Dynamic & Persistent:** Zero hardcoding. All actions (profile edits, settings, media uploads) must update the UI instantly and save to the database.

---

## 🏗️ System Architecture & Rules

### 1. Data Persistence Mandate (CRITICAL)
- **Zero Hardcoding:** No user data, posts, or settings should be hardcoded in the frontend.
- **MongoDB Core:** All dynamic data must be stored in MongoDB.
- **Optimistic UI:** Use Zustand to update the UI immediately upon user action. Perform API sync in the background. Revert and notify on failure.

### 2. Frontend (The Visual Engine)
- **Framework:** React 19 (Vite) with TypeScript.
- **Styling:** Pure Tailwind CSS + Modern Glassmorphism (Backdrop-blur).
- **State Management:** `Zustand` with `persist` middleware.
- **Performance:** Mandatory `React.lazy` and `Suspense` for all top-level routes.
- **Iconography:** Flaticon UIcons exclusively.

### 3. Backend (The Secure Core)
- **Runtime:** Node.js with Express 5.
- **Database:** MongoDB Atlas (Database Name: `JanNetra`).
- **Security:** 
    - `bcryptjs` for salted password hashing.
    - `jsonwebtoken` (JWT) for dual-token authentication (Access & Refresh).
    - Cookie-based token storage.
- **Media Handling:** `multer` for local server storage (DB stores only URL strings).

---

## 👤 User Functionality (The User Journey)

### 🏠 Home & Feed
- **Priority:** Feed prioritizes Village → Block → District → State → India.
- **Actions:** Like, Comment, Share, Save.

### 🔍 Explore India
- **Hierarchy:** India → State → District → Block → Village.
- **Search:** Leaders, Schemes, Projects, Community Posts.

### 🎥 Buzz (Video Feed)
- **Vertical Scroll:** Instagram reels-like snap-scrolling.
- **Content:** Local updates, citizen reports, awareness content.

### ➕ Create
- **Types:** Text, Image, Video Posts.
- **Categories:** Local News, Development, Schemes, Education, etc.

### 🏛 Governance Dashboard
- **Tracking:** My Area, My Leaders, Gov Schemes, Development Projects (Ongoing/Upcoming), Area Statistics, Public Issues.

---

## 🛠️ Development Progress & Fixes (June 2026)

### 1. Core Models Setup
- **User Model:** Expanded with Bio, Cover Image, and nested Settings (Privacy, Notifications, Preferences).
- **Post Model:** Implemented to handle all content types (Feed/Buzz) with hierarchical location tags.

### 2. UI Refinement
- **Compact UI:** Reduced base font size to 14px, optimized Navbar and Sidebar for a cleaner, modern look.
- **Header Enhancement:** Added backdrop-blur and refined shadows for a "solid" premium feel.
- **Media Integration:** Added dummy videos to Buzz and images to Home Feed for realistic testing.

---

## 📋 Professional Development Rules
1. **Strict Type Safety:** All entities (User, Location, Post) MUST have defined interfaces in `src/types/index.ts`.
2. **Clean Code:** Use `asyncHandler` and `ApiError` for modular backend logic.
3. **DRY Principles:** No logic duplication.
4. **Documentation:** Every major logic block must be commented for other developers to understand the "Why" behind the "How".

---
*Last Updated: June 13, 2026*
