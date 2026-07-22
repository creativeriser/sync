import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      navigate('/login');
    }
  }, [token, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setSubmitting(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      setSuccess(true);
      toast.success('Password successfully reset!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Set new password" subtitle="Please enter your new password below">
      {success ? (
        <div className="text-center space-y-4">
          <p className="text-ink2">Your password has been successfully reset. You can now log in with your new password.</p>
          <div className="pt-4">
            <Link to="/login" className="btn-primary w-full inline-block text-center">
              Go to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Resetting password...' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
