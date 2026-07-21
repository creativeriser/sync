const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const server = app.listen(env.PORT, async () => {
  console.log(`[project-service] running on http://localhost:${env.PORT}`);
  console.log(`[project-service] AI mode: ${env.AI_MOCK_MODE ? 'MOCK' : 'LIVE (Gemini)'} | Email mode: ${env.EMAIL_MOCK_MODE ? 'MOCK' : 'LIVE (SMTP)'}`);
  try {
    await prisma.$connect();
    console.log(`[project-service] Connected to MongoDB database successfully!`);
  } catch (err) {
    console.error(`[project-service] MongoDB connection error:`, err.message);
  }
});

async function shutdown(signal) {
  console.log(`\n[project-service] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
