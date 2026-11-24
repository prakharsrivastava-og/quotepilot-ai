import fs from 'node:fs';
import path from 'node:path';

const files = {};

files['firestore.rules'] = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null && request.auth.token.email_verified == true;
    }

    function isUserDocOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function belongsToBusiness(businessId) {
      return isSignedIn() && (
        get(/databases/$(database)/documents/businesses/$(businessId)).data.ownerUid == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId == businessId
      );
    }

    match /users/{userId} {
      allow read, write: if isUserDocOwner(userId);
    }

    match /businesses/{businessId} {
      allow create: if isSignedIn()
        && request.resource.data.ownerUid == request.auth.uid
        && request.resource.data.plan == 'starter';

      allow update: if belongsToBusiness(businessId)
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['plan'])
            || request.resource.data.plan == 'starter');

      allow read, delete: if belongsToBusiness(businessId);

      match /{subcollection}/{docId} {
        allow read, write: if belongsToBusiness(businessId);
      }
    }
  }
}
`;

files['src/context/AuthContext.jsx'] = `import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { subscribeBusiness, subscribeCollection } from '../services/firestoreService';
import { getMonthKey, PLAN_LIMITS } from '../utils/formatters';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [leads, setLeads] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAiModel, setSelectedAiModel] = useState(
    () => localStorage.getItem('qp_ai_model') || 'gemini-3.8-flash'
  );

  useEffect(() => {
    localStorage.setItem('qp_ai_model', selectedAiModel);
  }, [selectedAiModel]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setEmailVerified(Boolean(firebaseUser?.emailVerified));
      if (!firebaseUser) {
        setUserProfile(null);
        setBusiness(null);
        setLeads([]);
        setQuotations([]);
        setFollowups([]);
        setCustomers([]);
        setInteractions([]);
        setTeam([]);
        setLoading(false);
      } else if (!firebaseUser.emailVerified) {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !emailVerified || !db) return;
    setLoading(true);
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setUserProfile(snap.exists() ? snap.data() : null);
      if (!snap.exists()) {
        setBusiness(null);
        setLoading(false);
      }
    });
    return () => unsubUser();
  }, [user, emailVerified]);

  useEffect(() => {
    const businessId = userProfile?.businessId;
    if (!businessId || !emailVerified) return;

    const unsubs = [
      subscribeBusiness(businessId, (b) => { setBusiness(b); setLoading(false); }),
      subscribeCollection(businessId, 'leads', setLeads),
      subscribeCollection(businessId, 'quotations', setQuotations),
      subscribeCollection(businessId, 'followups', setFollowups, 'dueDate'),
      subscribeCollection(businessId, 'customers', setCustomers),
      subscribeCollection(businessId, 'interactions', setInteractions),
      subscribeCollection(businessId, 'team', setTeam)
    ];

    return () => unsubs.forEach((fn) => fn && fn());
  }, [userProfile?.businessId, emailVerified]);

  const refreshUser = async () => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const verified = Boolean(auth.currentUser.emailVerified);
    setEmailVerified(verified);
    return verified;
  };

  const currentMonth = getMonthKey();
  const planKey = business?.plan || 'starter';
  const planLimits = PLAN_LIMITS[planKey] || PLAN_LIMITS.starter;
  const aiCallsUsed = business?.usage?.aiCallsMonthKey === currentMonth ? (business?.usage?.aiCallsCount || 0) : 0;
  const quotesUsed = business?.usage?.quotesMonthKey === currentMonth ? (business?.usage?.quotesCount || 0) : 0;
  const logout = () => (auth ? signOut(auth) : Promise.resolve());

  return (
    <AuthContext.Provider
      value={{
        user, emailVerified, refreshUser, userProfile, business, leads, quotations, followups,
        customers, interactions, team, loading, isFirebaseConfigured,
        selectedAiModel, setSelectedAiModel, planLimits, aiCallsUsed, quotesUsed, logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
`;

files['src/pages/AuthPage.jsx'] = `import React, { useEffect, useState } from 'react';
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
        await signInWithEmailAndPassword(auth, email.trim(), password);
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
`;

files['src/components/ProtectedRoute.jsx'] = `import React, { useState } from 'react';
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
        setErr(e.message || 'Could not resend verification email. Wait a minute and try again.');
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
            Open that link in your email before entering QuotePilot AI.
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
`;

const serverPath = path.resolve(process.cwd(), 'server/index.js');
let serverCode = fs.readFileSync(serverPath, 'utf8');
const targetSnippet = `    req.authUser = {
      uid: verifyData.users[0].localId,
      email: verifyData.users[0].email || ''
    };`;
const replacementSnippet = `    if (!verifyData.users[0].emailVerified) {
      return res.status(403).json({ error: 'Please verify your email address before using AI features.' });
    }
    req.authUser = {
      uid: verifyData.users[0].localId,
      email: verifyData.users[0].email || ''
    };`;
if (serverCode.includes(targetSnippet)) {
  serverCode = serverCode.replace(targetSnippet, replacementSnippet);
  files['server/index.js'] = serverCode;
}

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relPath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated:', relPath);
}
console.log('Email verification security enabled!');