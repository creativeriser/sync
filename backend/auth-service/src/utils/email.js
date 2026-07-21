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

module.exports = {
  sendOtpEmail,
};
