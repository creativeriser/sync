const nodemailer = require('nodemailer');
const { SES, SendRawEmailCommand } = require('@aws-sdk/client-ses');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (env.EMAIL_MOCK_MODE) return null;
  if (!transporter) {
    if (env.SMTP_HOST === 'aws-ses') {
      const sesConfig = {
        region: env.AWS_REGION,
      };
      if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
        sesConfig.credentials = {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        };
      }
      const ses = new SES(sesConfig);
      transporter = nodemailer.createTransport({
        SES: { ses, aws: { SendRawEmailCommand } },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE, // true for port 465, false for 587/STARTTLS
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      });
    }
  }
  return transporter;
}

function baseTemplate({ title, message, ctaLabel, ctaUrl }) {

  return `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#12141C;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#1B1E2A;border:1px solid #2E3346;border-radius:16px;padding:28px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
        <span style="display:inline-block;width:24px;height:24px;background:#F5B942;border-radius:6px;"></span>
        <span style="color:#EDEFF7;font-weight:600;font-size:16px;">SyncMind AI</span>
      </div>
      <h2 style="color:#EDEFF7;font-size:18px;margin:0 0 12px;">${title}</h2>
      <p style="color:#8B90A8;font-size:14px;line-height:1.6;margin:0 0 20px;">${message}</p>
      ${ctaUrl
      ? `<a href="${ctaUrl}" style="display:inline-block;background:#F5B942;color:#12141C;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:10px;">${ctaLabel || 'Open project'}</a>`
      : ''
    }
      <p style="color:#5B6079;font-size:12px;margin-top:28px;">You're receiving this because you're a member of a SyncMind AI project. You can turn off email notifications anytime in Settings.</p>
    </div>
  </div>`;
}


async function sendNotificationEmail({ to, subject, title, message, ctaLabel, ctaUrl }) {
  if (!to) return { sent: false, reason: 'no-recipient' };

  if (env.EMAIL_MOCK_MODE) {

    console.log(`[email:mock] to=${to} subject="${subject}" — ${message}`);
    return { sent: false, mocked: true };
  }

  try {
    await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html: baseTemplate({ title, message, ctaLabel, ctaUrl }),
      text: `${title}\n\n${message}${ctaUrl ? `\n\n${ctaUrl}` : ''}`,
    });
    return { sent: true };
  } catch (err) {

    console.error(`[email] failed to send to ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendNotificationEmail };
