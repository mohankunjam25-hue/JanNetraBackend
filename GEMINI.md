# JanNetra Project: AI Instructions & Governance (GEMINI.md)

> **CRITICAL:** This file is the foundational mandate for all AI agents (Gemini, Cursor, etc.) working on this codebase. These instructions take absolute precedence over general defaults.

## ⚖️ Core Mandates
1. **Source of Truth**: Always consult `GEMINI.md` and `TECHNICAL_STACK.md` before proposing or implementing changes.
2. **Context Efficiency**: Research the codebase using `grep_search` and `glob` before making assumptions.
3. **Security First**: Never log, print, or commit secrets, API keys, or `.env` files.
4. **No Silent Refactoring**: Do not modify unrelated code or "clean up" logic without explicit instruction.

## 🛠️ Coding Standards (Backend)

### 1. Request/Response Pattern
- **AsyncHandler**: All controller functions MUST be wrapped in the `asyncHandler` utility.
- **Consistent Responses**: Use the `ApiResponse` class for all successful responses.
- **Error Handling**: Use the `ApiError` class for all errors. Never return raw JSON error objects.
- **Status Codes**:
  - `200/201`: Success/Created
  - `401`: Unauthorized (Use this instead of 404 for missing users during login)
  - `400`: Bad Request (Validation failures)
  - `403`: Forbidden (Permission issues)
  - `500`: Internal Server Error (Unexpected crashes)

### 2. Database (Mongoose)
- **Validation**: Ensure all model fields have appropriate validation and defaults.
- **Initialization**: Always check if nested objects (like `savedContent`) exist before accessing their properties.
- **Indexing**: Important fields like `username`, `email`, and `mobile` must have `index: true`.

### 3. Middleware
- **JWT Verification**: Always use the `verifyJWT` middleware for protected routes.
- **Multer**: Use the `upload` middleware for any endpoint involving file uploads (Avatar/Posts).

### 4. Code Style
- **No Emojis**: Do not include any emojis (e.g., ✅, ❌, 🚀) in source code, comments, or log messages. All output should be professional and clean.

## 🧪 Workflow & Validation

### 1. The Research-Strategy-Execution Cycle
- **Research**: Map the routes and controllers affected.
- **Strategy**: Share a concise plan before implementation.
- **Execution**: Apply surgical changes.

### 2. Mandatory Verification
- **Newman/Postman**: After any API change, run the relevant Postman collection using Newman to verify logic.
- **DB Check**: If a task involves data mutation, use `check_db.js` or a tool to verify the state of MongoDB.
- **Regression**: Ensure new changes do not break existing authentication or profile flows.

## 🚫 AI Behavioral Constraints
- **NEVER** ignore error handling in `try-catch` blocks.
- **NEVER** bypass the established architectural pattern (Route -> Middleware -> Controller -> Model).
- **NEVER** assume a package is installed; check `package.json` first.
- **NEVER** use `any` or vague variable names like `data` or `info` without specific context.

## Strict UI Templating (DRY Principle)
- **NEVER** write new, redundant HTML/Tailwind code for standard UI elements (Buttons, Cards, Avatars, Inputs, Dropdown Menus, IconButtons).
- You **MUST** import and use the pre-built reusable templates from `frontend/src/shared/ui/index.ts`.
- *Example:* Instead of `<button className="bg-accent...">`, you MUST use `<Button variant="primary">`.
- Only write custom Tailwind HTML for highly specialized components that do not fit into the standard templates.

## Strict MVC Architecture & Professional Routing
- **Backend**: Adhere strictly to the Model-View-Controller (MVC) pattern.
  - **Routes**: Keep routes lean (`routes/`). Only define endpoints and middleware.
  - **Controllers**: All business logic goes here (`controllers/`). Use the `asyncHandler` and reusable helpers (`validationHelper.js`, `privacyHelper.js`).
  - **Models**: Database schema and indexing only (`models/`).
- **Frontend**: Maintain separation of concerns. Keep logic inside custom hooks (`hooks/`) or Zustand stores (`store/`). Components (`components/`) should primarily handle rendering.

---
*Created: June 14, 2026*
*Updated: June 16, 2026*
*Status: ACTIVE MANDATE*
