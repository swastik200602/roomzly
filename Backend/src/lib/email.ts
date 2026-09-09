import nodemailer from "nodemailer";
import { env, isProduction } from "@/config/env.js";
import { logger } from "@/lib/logger.js";

function smtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!smtpConfigured()) {
    if (!isProduction) {
      logger.info({ to, resetUrl }, "Password reset email skipped because SMTP is not fully configured");
    } else {
      logger.warn({ to }, "Password reset email skipped because SMTP is not fully configured");
    }
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000
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
    return true;
  } catch (error) {
    logger.error({ error, to }, "Password reset email delivery failed");
    return false;
  }
}

export async function sendVerificationEmail(to: string, verifyUrl: string, name?: string): Promise<boolean> {
  if (!smtpConfigured()) {
    if (!isProduction) {
      logger.info({ to, verifyUrl }, "Email verification link generated (SMTP not configured in local dev)");
    } else {
      logger.warn({ to }, "Email verification skipped because SMTP is not fully configured");
    }
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000
    });

    const greeting = name ? `Hi ${name}` : "Hello";

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: "Verify your Roomzly account",
      text: `${greeting},\n\nPlease verify your email address to complete your Roomzly registration. Click the link below:\n\n${verifyUrl}\n\nThis verification link expires in 24 hours.\n\nWelcome to Roomzly!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #0f172a; background-color: #ffffff;">
          <div style="margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.04em; color: #0f172a;">ROOMZLY</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0f172a;">Verify your email address</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            ${greeting}, welcome to Roomzly! Please confirm your email address to activate your account and start discovering verified student living in Dehradun.
          </p>
          <div style="margin-bottom: 28px;">
            <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 4px;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin-bottom: 8px;">
            Or copy and paste this verification link directly into your browser:
          </p>
          <p style="font-size: 11px; word-break: break-all; color: #64748b; margin-bottom: 24px;">
            ${verifyUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 16px;" />
          <p style="font-size: 11px; color: #94a3b8;">
            This link expires in 24 hours. If you did not create this account, you can safely ignore this email.
          </p>
        </div>
      `
    });
    return true;
  } catch (error) {
    logger.error({ error, to }, "Verification email delivery failed");
    return false;
  }
}

