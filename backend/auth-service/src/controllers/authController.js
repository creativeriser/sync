const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');
const { ok, created, AppError } = require('../utils/apiResponse');
const crypto = require('crypto');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/email');

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    emailNotificationsEnabled: user.emailNotificationsEnabled,
  };
}

async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.isVerified) {
      throw new AppError('An account with this email already exists', 409);
    } else {
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await prisma.user.update({
        where: { email },
        data: { otpCode, otpExpiresAt, passwordHash: await bcrypt.hash(password, 12), name }
      });
      try {
        await sendOtpEmail(email, otpCode);
        return ok(res, { message: 'OTP resent to email. Please verify.', email });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('SES Sandbox Error:', err.message);
        return ok(res, { message: 'Account updated, but email failed to send (Sandbox). Check console for OTP.', email });
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, avatarColor, isVerified: false, otpCode, otpExpiresAt },
  });

  try {
    await sendOtpEmail(email, otpCode);
    return created(res, { message: 'OTP sent to email. Please verify.', email });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('SES Sandbox Error:', err.message);
    console.log(`[SES Sandbox Fallback] OTP for ${email} is: ${otpCode}`);
    return created(res, { message: 'Account created, but email failed to send (Sandbox). Check console for OTP.', email });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ sub: user.id, name: user.name, email: user.email });
  return ok(res, { user: publicUser(user), token });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError('User not found', 404);
  return ok(res, { user: publicUser(user) });
}

async function updatePreferences(req, res) {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { emailNotificationsEnabled: req.body.emailNotificationsEnabled },
  });
  return ok(res, { user: publicUser(user) });
}

async function verifyOtp(req, res) {
  const { email, otpCode } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.otpCode !== otpCode) {
    throw new AppError('Invalid OTP', 400);
  }

  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }
  
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { isVerified: true, otpCode: null, otpExpiresAt: null }
  });

  const token = signToken({ sub: updatedUser.id, name: updatedUser.name, email: updatedUser.email });
  return ok(res, { user: publicUser(updatedUser), token });
}

async function resendOtp(req, res) {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (user.isVerified) {
    throw new AppError('Account is already verified', 400);
  }

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { otpCode, otpExpiresAt }
  });

  try {
    await sendOtpEmail(email, otpCode);
    return ok(res, { message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('SES Sandbox Error on Resend:', err.message);
    return ok(res, { message: 'A new OTP was generated but email failed to send (Sandbox).' });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  // We return a success message even if the user is not found to prevent email enumeration
  if (!user) {
    return ok(res, { message: 'If that email address is in our database, we will send you an email to reset your password.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiresAt }
  });

  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('SES Sandbox Error on Forgot Password:', err.message);
  }
  return ok(res, { message: 'If that email address is in our database, we will send you an email to reset your password.' });
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null
    }
  });

  return ok(res, { message: 'Password has been successfully reset. You can now log in.' });
}

module.exports = { register, login, verifyOtp, resendOtp, me, updatePreferences, forgotPassword, resetPassword };
