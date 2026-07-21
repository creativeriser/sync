const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { sendOtpEmail } = require('../src/utils/email');

jest.mock('../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }
}));

jest.mock('../src/utils/email', () => ({
  sendOtpEmail: jest.fn()
}));

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user and send an OTP email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        isVerified: false
      });

      const res = await request(app)
        .post('/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.message).toMatch(/OTP sent/);
      expect(sendOtpEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });

    it('should return 409 if verified user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        isVerified: true
      });

      const res = await request(app)
        .post('/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /verify-otp', () => {
    it('should verify OTP and return a token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        otpCode: '123456',
        name: 'Test User'
      });
      
      prisma.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isVerified: true
      });

      const res = await request(app)
        .post('/verify-otp')
        .send({
          email: 'test@example.com',
          otpCode: '123456'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });
  });
});
