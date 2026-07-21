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
  PORT: parseInt(process.env.PORT || '5001', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: dbUrl,
  MONGODB_URI: dbUrl,

  JWT_SECRET: required('JWT_SECRET', 'dev_only_insecure_secret_change_me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  EMAIL_FROM: process.env.EMAIL_FROM || 'SyncMind AI <notifications@syncmind.ai>',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
};

env.EMAIL_MOCK_MODE = !process.env.AWS_ACCESS_KEY_ID;

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_only_insecure_secret_change_me') {
  // eslint-disable-next-line no-console
  console.error('[env] Refusing to start in production with the default JWT_SECRET.');
  process.exit(1);
}

module.exports = env;
