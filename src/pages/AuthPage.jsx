import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { AlertBanner, Button, Card } from '../components/UI';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, business } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(business ? '/app/dashboard' : '/onboarding', { replace: true });
    }
  }, [user, business, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Copy .env.example to .env and add your Firebase Web App credentials.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        await sendEmailVerification(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!cred.user.emailVerified) {
          try { await sendEmailVerification(cred.user); } catch {}
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy-900 text-white font-bold flex items-center justify-center">
            QP
          </div>
          <span className="text-xl font-bold text-slate-900">QuotePilot AI</span>
        </Link>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'register' ? 'Create your business account' : 'Sign in to your sales workspace'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8">
          {!isFirebaseConfigured && (
            <div className="mb-4">
              <AlertBanner
                type="warning"
                title="Firebase Configuration Required"
                message="Create a .env file from .env.example with your Firebase Web App keys, then restart Vite."
              />
            </div>
          )}

          {error && (
            <div className="mb-4">
              <AlertBanner type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@sparkleclean.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              {mode === 'register' ? 'Create Account & Send Verification' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
            {mode === 'register' ? (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-blue-600 font-medium hover:underline">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to QuotePilot AI?{' '}
                <button onClick={() => setMode('register')} className="text-blue-600 font-medium hover:underline">
                  Create account
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
