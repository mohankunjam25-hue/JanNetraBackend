const { Resend } = require('resend');

/**
 * @description Professional Email Service using Resend
 * Supports sending OTPs and beautiful HTML templates
 */
const sendEmail = async (options) => {
    // 1. Initialize Resend with API Key from .env
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        // 2. Send the email
        const data = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'JanNetra Support <onboarding@resend.dev>',
            to: options.email,
            subject: options.subject,
            html: options.html,
            text: options.message,
        });

        console.log("Email sent successfully via Resend:", data.id);
        return data;

    } catch (error) {
        console.error("Resend Email Delivery Error:", error);
        throw new Error("Email delivery failed");
    }
};

module.exports = sendEmail;
