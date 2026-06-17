# JanNetra Project: Technical Stack Documentation

This document provides a comprehensive overview of the technologies, frameworks, and packages used in the **RealJanNetra** project.

## 🚀 Core Technologies
- **Node.js**: The primary JavaScript runtime environment used for building the scalable backend and automation services.
- **JavaScript (ES6+)**: The core programming language used throughout the project.

## 🛠️ Backend Stack (Express API)

### Framework
- **Express.js (v5.x)**: A fast, unopinionated, minimalist web framework for Node.js. Used to handle routing, middleware integration, and API request-response cycles.

### Database & ORM
- **Mongoose**: An elegant MongoDB object modeling tool. It provides a straight-forward, schema-based solution to model application data, including built-in validation and query building.
- **MongoDB Atlas**: Cloud-hosted NoSQL database used for storing user profiles, posts, and governance data.

### Security & Authentication
- **JSON Web Token (JWT)**: Used for secure transmission of information between parties as a JSON object. Implements the `accessToken` and `refreshToken` pattern for secure user sessions.
- **Bcryptjs**: A library to help you hash passwords. Used for storing passwords securely in the database using salted hashes.
- **Cookie-Parser**: Middleware to parse cookies attached to the client request, used to handle secure HTTP-only tokens.
- **CORS**: Cross-Origin Resource Sharing middleware, allowing the backend to securely communicate with frontend applications or external tools.

### Media & File Handling
- **Multer**: A node.js middleware for handling `multipart/form-data`, primarily used for uploading user avatars, cover images, and post media (images/videos).

### Communication & Utilities
- **Nodemailer**: A module for Node.js applications to allow easy email sending. Used for sending Password Reset OTPs.
- **Resend**: A high-performance email API used as an alternative or primary provider for transactional emails.
- **Dotenv**: Zero-dependency module that loads environment variables from a `.env` file into `process.env`.

---

## 🤖 Automation & AI Integration (MCP Server)

### AI Interface
- **Model Context Protocol (MCP) SDK**: The core SDK used to build the MCP server, allowing Gemini CLI and other AI agents to execute local tools (like DB checks and API tests).

### Testing & Verification
- **Newman**: The CLI companion for Postman. It allows running and testing Postman collections directly from the command line, enabling automated API validation.
- **Axios**: A promise-based HTTP client for the browser and node.js. Used in the MCP server to trigger live Postman runs via the Postman API.
- **Mongoose (Re-used)**: Used in the MCP server to verify real-time data changes in MongoDB after API tests are executed.

---

## 👨‍💻 Development Tools
- **Nodemon**: A tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.

---

## 📂 Project Structure Overview
- `/backend`: Contains the Express.js source code, controllers, routes, and models.
- `/mcp-server`: Contains the automation bridge, Postman integration scripts, and verification tools.
- `/frontend`: The client-side application (React/Native).

---
*Last Updated: June 14, 2026*
