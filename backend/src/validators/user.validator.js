const { z } = require("zod");

const registerSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, "Full name is required").trim(),
        username: z.string()
            .min(6, "Username must be at least 6 characters")
            .max(15, "Username cannot exceed 15 characters")
            .regex(/^[a-z0-9._]+$/i, "Username can only contain letters, numbers, periods, and underscores")
            .trim().toLowerCase(),
        email: z.string().email("Invalid email format").toLowerCase(),
        mobile: z.string().min(10, "Mobile number must be valid"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        state: z.string().min(1, "State is required"),
        district: z.string().min(1, "District is required"),
        block: z.string().min(1, "Block is required"),
        village: z.string().optional(),
        interests: z.array(z.string()).optional()
    })
});

const loginSchema = z.object({
    body: z.object({
        username: z.string().optional(),
        mobile: z.string().optional(),
        password: z.string().min(1, "Password is required")
    }).refine(data => data.username || data.mobile, {
        message: "Username or mobile is required",
        path: ["username"]
    })
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format").toLowerCase()
    })
});

const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format").toLowerCase(),
        otp: z.string().min(6, "OTP must be valid"),
        newPassword: z.string().min(6, "New password must be at least 6 characters")
    })
});

const updateAccountSchema = z.object({
    body: z.object({
        fullName: z.string().optional(),
        mobile: z.string().optional(),
        bio: z.string().max(250, "Bio cannot exceed 250 characters").optional()
    }).refine(data => data.fullName || data.mobile || data.bio !== undefined, {
        message: "At least one field is required to update",
        path: ["fullName"]
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateAccountSchema
};