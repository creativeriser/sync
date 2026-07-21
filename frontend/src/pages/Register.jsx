import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' or 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer effect for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await register(form.name, form.email, form.password);
      toast.success(res.message || 'OTP sent to your email');
      setStep('otp');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyOtp(form.email, otpCode);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setSubmitting(true);
    try {
      const res = await resendOtp(form.email);
      toast.success(res.message || 'New OTP sent!');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Verify your email" subtitle="We sent a 6-digit code to your email.">
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className="label">Verification Code</label>
            <input
              required
              className="input text-center tracking-widest text-lg"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
            />
          </div>
          <button type="submit" disabled={submitting || otpCode.length < 6} className="btn-primary w-full mt-2">
            {submitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button 
            type="button" 
            disabled={resendCooldown > 0 || submitting} 
            onClick={handleResendOtp}
            className="text-sm text-signal hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start turning conversations into projects">
      <form onSubmit={handleRegisterSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            required
            minLength={8}
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="text-sm text-ink2-muted mt-5 text-center">
        Already have an account? <Link to="/login" className="text-signal hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
