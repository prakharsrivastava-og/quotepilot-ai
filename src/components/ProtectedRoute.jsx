import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { LogOut, Mail, RefreshCw } from 'lucide-react';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { AlertBanner, Button, Card, LoadingSpinner } from './UI';

export function ProtectedRoute({ children, requireBusiness = true }) {
  const { user, emailVerified, refreshUser, logout, business, loading, isFirebaseConfigured } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!isFirebaseConfigured) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Verifying QuotePilot AI workspace..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!emailVerified) {
    const handleCheck = async () => {
      setChecking(true);
      setErr('');
      setMsg('');
      try {
        const ok = await refreshUser();
        if (!ok) {
          setErr('Your email is still not verified. Please click the verification link in your inbox (check Spam too), then try again.');
        }
      } catch (e) {
        setErr(e.message || 'Could not check verification status.');
      } finally {
        setChecking(false);
      }
    };

    const handleResend = async () => {
      setResending(true);
      setErr('');
      setMsg('');
      try {
        await sendEmailVerification(auth.currentUser);
        setMsg('Verification email resent to ' + user.email + '. Check your Inbox and Spam folder.');
      } catch (e) {
        setErr(e.message || 'Could not resend verification email. Wait 1 minute and try again.');
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verify your email address</h1>
          <p className="text-sm text-slate-600">
            To prevent fake accounts, we sent a verification link to <strong>{user.email}</strong>.
            Open that link in your email (check Spam too) before entering QuotePilot AI.
          </p>

          {msg && <AlertBanner type="success" message={msg} />}
          {err && <AlertBanner type="error" message={err} />}

          <div className="space-y-2.5 pt-2">
            <Button className="w-full" loading={checking} onClick={handleCheck}>
              <RefreshCw className="w-4 h-4" /> I've Verified — Continue
            </Button>
            <Button className="w-full" variant="secondary" loading={resending} onClick={handleResend}>
              Resend Verification Email
            </Button>
            <Button className="w-full" variant="ghost" onClick={logout}>
              <LogOut className="w-4 h-4" /> Sign Out / Use Different Email
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (requireBusiness && !business) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
