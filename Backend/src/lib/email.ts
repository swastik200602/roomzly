import nodemailer from "nodemailer";
import { env, isProduction } from "@/config/env.js";
import { logger } from "@/lib/logger.js";

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!smtpConfigured()) {
    if (!isProduction) {
      logger.info({ to, resetUrl }, "Password reset email skipped because SMTP is not fully configured");
    } else {
      logger.warn({ to }, "Password reset email skipped because SMTP is not fully configured");
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your Roomzly password",
    text: `Use this link to reset your Roomzly password. It expires in 15 minutes.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: [
      "<p>Use this link to reset your Roomzly password. It expires in 15 minutes.</p>",
      `<p><a href="${resetUrl}">Reset password</a></p>`,
      "<p>If you did not request this, you can ignore this email.</p>"
    ].join("")
  });
}
