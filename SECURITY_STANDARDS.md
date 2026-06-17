# 🛡️ JanNetra Project: Cyber Security Standards

This document outlines the security protocols and implementation standards for the JanNetra platform. These standards are mandatory for all developers to follow to ensure user trust and platform integrity.

---

## 1. User Authentication & Password Management
Passwords are the most common target for attackers. We must ensure they are never compromised.

### **Standards:**
- **Password Hashing:** Use `bcryptjs` with a cost factor (salt rounds) of at least 10. Never store plain-text passwords.
- **Strong Password Policy:** Enforce a minimum of 8 characters, including at least one uppercase letter, one number, and one special character.
- **Sensitive Data Exclusion:** Always exclude sensitive fields like `password` and `refreshToken` when returning user objects from the database.
  - *Code Pattern:* `User.findById(id).select("-password -refreshToken")`

---

## 2. Session Management (HttpOnly Cookies)
To prevent **XSS (Cross-Site Scripting)** attacks, session tokens must not be accessible via client-side JavaScript.

### **Implementation Mandates:**
- **HttpOnly:** All JWT tokens (Access & Refresh) must be sent to the client via HTTP-only cookies.
- **Secure Flag:** In production, cookies must have the `secure: true` flag to ensure they are only sent over HTTPS.
- **SameSite Policy:** Use `sameSite: 'Strict'` or `'Lax'` to protect against **CSRF (Cross-Site Request Forgery)**.
- **Token Expiry:**
  - Access Token: Short-lived (15–30 minutes).
  - Refresh Token: Long-lived (7–10 days) with database-side validation.

---

## 3. Multi-Factor Authentication (2FA)
2FA is required for sensitive accounts and recommended for all users.

### **Implementation Logic:**
- **Primary Method (OTP):** Use 6-digit One-Time Passwords sent via registered Email or SMS.
- **Secondary Method (TOTP):** Implement support for Authenticator Apps (Google/Microsoft Authenticator) using `speakeasy` or `otplib`.
- **Workflow:** 
  1. Verify Username/Password.
  2. If 2FA is enabled, issue a temporary "pre-auth" token.
  3. Require the 2FA code to issue the final session tokens.
- **Recovery:** Provide 8-10 one-time use recovery codes for users who lose access to their primary 2FA method.

---

## 4. API & Network Security
Protect the infrastructure from automated attacks and malicious input.

### **Standards:**
- **Rate Limiting:** Implement `express-rate-limit` on all public endpoints, especially `/login` and `/register`, to prevent brute-force attacks.
- **Input Sanitization:** Sanitize all user inputs to prevent **NoSQL Injection**. Use schema validation libraries like `Zod` or `Joi`.
- **Security Headers:** Use the `helmet` middleware to set essential security headers automatically.
- **Environment Isolation:** Ensure `.env` files are never committed to version control and are only accessible by the server process.

---

## 5. Auditing & Monitoring
Continuous monitoring is essential for identifying and responding to security incidents.

### **Best Practices:**
- **Audit Logs:** Record significant security events (logins, password changes, MFA enabling) with timestamps, IP addresses, and device info.
- **Error Handling:** Never reveal technical details (stack traces) to the client. Use a generic `ApiError` format.
- **Dependency Scanning:** Regularly run `npm audit` to check for vulnerabilities in third-party packages.

---
*Last Updated: June 14, 2026*
*Status: MANDATORY COMPLIANCE*
