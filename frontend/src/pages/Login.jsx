import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFillDemo() {
    setForm({ email: 'demo@syncmind.ai', password: 'password123' });
    toast.success('Filled demo credentials!');
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your projects">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <div className="mt-4 pt-4 border-t border-ink2-faint/20 text-center">
        <button
          type="button"
          onClick={handleFillDemo}
          className="text-xs px-3 py-1.5 rounded bg-signal/10 hover:bg-signal/20 text-signal transition-colors inline-flex items-center gap-1.5"
        >
          <span>⚡</span> Quick Fill Demo Credentials
        </button>
      </div>
      <p className="text-sm text-ink2-muted mt-5 text-center">
        Don't have an account? <Link to="/register" className="text-signal hover:underline">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
