# JanNetra API Documentation 👁️

This file lists all the APIs implemented and required for the JanNetra platform. All endpoints are prefixed with `/api/v1`.

---

## 1. User & Authentication APIs
Handle user identity, sessions, and profile data.

| Method | Endpoint | Description | Auth Required |
|:--- |:--- |:--- |:---:|
| **POST** | `/users/register` | Create a new citizen account | No |
| **POST** | `/users/login` | Secure login (JWT based) | No |
| **POST** | `/users/logout` | Clear session cookies | Yes |
| **GET** | `/users/current-user` | Fetch logged-in user details | Yes |
| **GET** | `/users/profile/:username` | View any citizen's profile | Yes |
| **PATCH** | `/users/update-account` | Update Name, Bio, and Mobile | Yes |
| **PATCH** | `/users/update-settings` | Update Privacy, Theme, Notifications | Yes |
| **PATCH** | `/users/update-images` | Upload Avatar/Cover Image (Multer) | Yes |
| **PATCH** | `/users/save-content` | Save/Unsave Posts, Schemes, Leaders | Yes |

---

## 2. Posts & Content APIs
Handle text updates, images, and videos (Buzz).

| Method | Endpoint | Description | Auth Required |
|:--- |:--- |:--- |:---:|
| **POST** | `/posts` | Create new post (Text/Image/Video) | Yes |
| **GET** | `/posts` | Hierarchical Feed (Village -> National) | Yes |
| **GET** | `/posts/buzz` | Vertical video feed (Reels) | Yes |
| **PATCH** | `/posts/like/:postId` | Toggle like on a post | Yes |
| **DELETE** | `/posts/:postId` | Remove a post (Author only) | Yes |

---

## 3. Governance APIs (Upcoming/Planned)
Handle administrative and tracking data.

| Method | Endpoint | Description | Status |
|:--- |:--- |:--- |:---:|
| **GET** | `/gov/schemes` | Fetch central/state schemes | Planned |
| **GET** | `/gov/leaders` | Fetch area-specific leaders | Planned |
| **GET** | `/gov/projects` | Fetch local development projects | Planned |
| **POST** | `/gov/issues` | Report a local problem (Water/Road) | Planned |

---

## Technical Notes:
- **Base URL:** `http://localhost:5000/api/v1`
- **Data Format:** All requests/responses use `application/json` except media uploads.
- **Media Uploads:** Use `multipart/form-data` for endpoints involving files.
- **Security:** CSRF protection and dual-token (Access/Refresh) strategy is active.
