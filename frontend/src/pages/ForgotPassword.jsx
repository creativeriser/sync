import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
      toast.success('Password reset instructions sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to request password reset');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send you instructions to reset it">
      {success ? (
        <div className="text-center space-y-4">
          <p className="text-ink2">Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.</p>
          <div className="pt-4">
            <Link to="/login" className="btn-primary w-full inline-block text-center">
              Back to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Sending instructions...' : 'Send reset instructions'}
          </button>
        </form>
      )}
      
      {!success && (
        <p className="text-sm text-ink2-muted mt-5 text-center">
          Remembered your password? <Link to="/login" className="text-signal hover:underline">Log in</Link>
        </p>
      )}
    </AuthLayout>
  );
}
