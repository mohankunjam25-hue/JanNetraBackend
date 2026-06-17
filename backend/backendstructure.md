# JanNetra Backend Structure

Yeh document `RealJanNetra` project ke backend folders aur unke kaam ki jankari deta hai.

## `src/` Folder Structure

| Folder/File | Kaam (Purpose) |
| :--- | :--- |
| **`config/`** | Database connection (jaise MongoDB) aur environmental configurations ke liye. |
| **`controllers/`** | Main business logic handle karta hai. Request aur response ke beech ka bridge hai. |
| **`middlewares/`** | Request aur response ke beech execute hone wale functions (jaise Auth check, Error handling). |
| **`models/`** | Database schema definitions (Mongoose models) yahan hote hain. |
| **`routes/`** | API endpoints (URLs) define karta hai aur unhe sahi controllers se jodta hai. |
| **`services/`** | Database queries aur complex logic ko controllers se alag rakhne ke liye. |
| **`utils/`** | Reusable helper functions jaise ApiError, ApiResponse, aur asyncHandler. |
| **`app.js`** | Express application configuration aur global middlewares ka setup. |
| **`server.js`** | Backend ka entry point jo server ko start aur database ko connect karta hai. |

## Root Files

- **`package.json`**: Project dependencies aur scripts ki details.
- **`.env.example`**: Environment variables ka template (Port, MongoDB URI, etc.).
- **`backendstructure.md`**: (Yeh file) Backend structure ki documentation.

---
*Note: Abhi folder structure taiyaar hai, logic (models, routes, controllers) ko implementation ki zaroorat hai.*
