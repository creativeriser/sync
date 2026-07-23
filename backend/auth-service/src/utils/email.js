const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const env = require('../config/env');

const sesClient = new SESClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

async function sendOtpEmail(toAddress, otpCode) {
  if (env.EMAIL_MOCK_MODE) {
    // eslint-disable-next-line no-console
    console.log(`[MOCK EMAIL] To: ${toAddress}, OTP: ${otpCode}`);
    return;
  }

  const params = {
    Source: env.EMAIL_FROM,
    Destination: {
      ToAddresses: [toAddress],
    },
    Message: {
      Subject: {
        Data: 'SyncMind AI - Your Verification Code',
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to SyncMind AI!</h2>
              <p>Your verification code is:</p>
              <h1 style="color: #6366f1; letter-spacing: 5px;">${otpCode}</h1>
              <p>This code will expire shortly. Do not share it with anyone.</p>
            </div>
          `,
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SES Error]', error);
    throw new Error('Failed to send verification email');
  }
}

async function sendPasswordResetEmail(toAddress, resetToken) {
  if (env.EMAIL_MOCK_MODE) {
    // eslint-disable-next-line no-console
    console.log(`[MOCK EMAIL] To: ${toAddress}, Password Reset Link: ${env.CLIENT_URL}/reset-password?token=${resetToken}`);
    return;
  }

  const resetLink = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const params = {
    Source: env.EMAIL_FROM,
    Destination: {
      ToAddresses: [toAddress],
    },
    Message: {
      Subject: {
        Data: 'SyncMind AI - Password Reset Request',
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the link below to set a new password:</p>
              <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
              <p>This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SES Error]', error);
    throw new Error('Failed to send password reset email');
  }
}

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
};
