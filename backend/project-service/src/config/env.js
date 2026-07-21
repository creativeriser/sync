require('dotenv').config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
}

const directUrl = process.env.DATABASE_URL;
const srvUrl = process.env.MONGODB_URI;

// Production (Render/cloud) uses SRV connection string; local Windows dev fallback to direct seedlist URL
let dbUrl = process.env.NODE_ENV === 'production' && srvUrl
  ? srvUrl
  : (directUrl || srvUrl || 'file:./dev.db');

if (dbUrl && dbUrl.includes('ssl=true')) {
  dbUrl = dbUrl.replace('ssl=true', 'tls=true');
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5002', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: dbUrl,
  MONGODB_URI: dbUrl,

  JWT_SECRET: required('JWT_SECRET', 'dev_only_insecure_secret_change_me'),
  GEMINI_API_KEY: (process.env.GEMINI_API_KEY || '').trim(),
  GEMINI_MODEL: (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim(),
  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '2', 10),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'SyncMind AI <notifications@syncmind.ai>',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
};

env.AI_MOCK_MODE = !env.GEMINI_API_KEY;
env.EMAIL_MOCK_MODE = !env.SMTP_HOST;

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_only_insecure_secret_change_me') {
  // eslint-disable-next-line no-console
  console.error('[env] Refusing to start in production with the default JWT_SECRET.');
  process.exit(1);
}

module.exports = env;
