// Sends the password-reset verification code by email.
//
// Real delivery needs SMTP settings in backend/.env (see .env.example) and the
// "nodemailer" package (npm install). Without SMTP settings:
//   - in development the code is printed in the server console instead;
//   - in production nothing is sent and an error is logged.
// The code is never returned by the API.

let transporter;

function smtpConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

function getTransporter() {
    if (transporter !== undefined) return transporter;

    transporter = null;

    if (!smtpConfigured()) return transporter;

    try {
        const nodemailer = require("nodemailer");

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: process.env.SMTP_USER
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined
        });
    } catch (error) {
        console.error(
            "MAILER: SMTP is configured but nodemailer is not installed. Run: npm install (in backend/)"
        );
    }

    return transporter;
}

async function sendResetCode(to, code, minutes) {
    const mail = getTransporter();

    if (!mail) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Email delivery is not configured (set SMTP_* in .env).");
        }

        console.log(
            `\n[DEV ONLY] Password reset code for ${to}: ${code}  (valid ${minutes} minutes)\n` +
                "Configure SMTP_* in backend/.env to send real emails.\n"
        );
        return;
    }

    await mail.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: "Your password reset verification code",
        text:
            `Your verification code is ${code}.\n\n` +
            `It expires in ${minutes} minutes. If you did not ask to reset your password, ` +
            "you can ignore this email. Never share this code with anyone.",
        html:
            `<p>Your verification code is:</p>` +
            `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>` +
            `<p>It expires in ${minutes} minutes. If you did not ask to reset your password, you can ignore this email.</p>` +
            `<p>Never share this code with anyone.</p>`
    });
}

module.exports = { sendResetCode };
