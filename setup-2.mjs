import fs from 'node:fs';
import path from 'node:path';

const files = {};

files['src/components/Layout.jsx'] = `import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, Briefcase, Clock, CreditCard, FileText, Kanban,
  LayoutDashboard, LogOut, Menu, Plug, Settings, Sparkles,
  TrendingDown, UserPlus, Users, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/leads', label: 'Leads', icon: Kanban },
  { to: '/app/ai-intelligence', label: 'AI Intelligence', icon: Sparkles, highlight: true },
  { to: '/app/quotations', label: 'Quotations', icon: FileText },
  { to: '/app/customers', label: 'Customers', icon: Users },
  { to: '/app/follow-ups', label: 'Follow-ups', icon: Clock },
  { to: '/app/analytics', label: 'Sales Analytics', icon: BarChart3 },
  { to: '/app/lost-deals', label: 'Lost Deals', icon: TrendingDown },
  { to: '/app/team', label: 'Team', icon: UserPlus },
  { to: '/app/integrations', label: 'Integrations', icon: Plug },
  { to: '/app/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/app/settings', label: 'Settings', icon: Settings }
];

export default function Layout() {
  const { business, userProfile, logout, aiCallsUsed, planLimits } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-navy-900 text-slate-200">
      <div className="flex items-center justify-between px-5 h-16 border-b border-navy-700/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            QP
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">QuotePilot AI</p>
            <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[140px]">
              {business?.name || 'Workspace'}
            </p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : item.highlight
                  ? 'text-blue-300 hover:bg-navy-800 hover:text-white'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white')
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-navy-700/80 space-y-3">
        <div className="bg-navy-800/80 rounded-lg p-3 border border-navy-700">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span>AI Quota ({planLimits.name})</span>
            <span className="font-semibold text-white">{aiCallsUsed}/{planLimits.aiCallsPerMonth}</span>
          </div>
          <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: Math.min(100, Math.round((aiCallsUsed / planLimits.aiCallsPerMonth) * 100)) + '%' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{userProfile?.displayName || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{userProfile?.role || 'Owner'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 max-w-full h-full z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Briefcase className="w-4 h-4 text-slate-400 hidden sm:block" />
              <span className="font-medium text-slate-800">{business?.name || 'QuotePilot AI'}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline text-xs text-slate-500">{business?.industry || 'Residential Cleaning'}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/ai-intelligence')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Inquiry
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
`;

files['src/pages/LandingPage.jsx'] = `import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, FileText, GraduationCap, ShieldCheck, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TEAM_MEMBERS = [
  { name: 'Prakhar Srivastava', scholarNo: '26U020115' },
  { name: 'Prakhar Srivastava', scholarNo: '26U020165' },
  { name: 'Shreyash Seth', scholarNo: '26U020157' }
];

const WORKFLOW_STEPS = [
  '1. Capture Inquiry',
  '2. Gemini AI Analysis',
  '3. Lead Qualification',
  '4. Editable Reply',
  '5. Priced Quotation & PDF',
  '6. Follow-up & Analytics'
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-white font-bold text-sm flex items-center justify-center">
              QP
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">QuotePilot AI</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#about-team" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline">
              Team & Course
            </a>
            {user ? (
              <Link
                to="/app/dashboard"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                Open Workspace
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2">
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="bg-navy-900 text-white py-20 px-4 sm:px-6 border-b border-navy-800">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Built for Independent Residential Cleaning & Service Businesses
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Turn Every Inquiry Into an Opportunity.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            QuotePilot AI qualifies customer inquiries with Gemini, flags missing job details,
            drafts accurate responses, generates branded PDF quotations from your real service prices,
            and tracks every follow-up through conversion.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to={user ? '/app/dashboard' : '/auth?mode=register'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm"
            >
              {user ? 'Go to Dashboard' : 'Create Business Workspace'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-slate-200 text-sm font-medium"
            >
              See End-to-End Workflow
            </a>
          </div>
        </div>
      </section>

      <section id="workflow" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Complete Sales Pipeline Architecture</h2>
          <p className="mt-2 text-sm text-slate-600">
            Every step backed by Cloud Firestore isolation and server-side Gemini AI.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {WORKFLOW_STEPS.map((step) => (
            <div key={step} className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-sm">
              <p className="text-xs font-semibold text-blue-700">{step}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">AI Lead Qualification</h3>
            <p className="mt-2 text-sm text-slate-600">
              Scores inquiries, identifies urgency, lists missing property details, detects pricing objections,
              and generates an editable reply grounded in your service catalog.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Catalog-Priced Quotations & PDF</h3>
            <p className="mt-2 text-sm text-slate-600">
              Build itemized quotations with discounts and tax, preview them in a clean document layout,
              record status changes, and export customer-ready PDFs.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Real Analytics & Lost Insights</h3>
            <p className="mt-2 text-sm text-slate-600">
              Track conversion rates, pipeline revenue, follow-up completion, and lost-deal reasons directly
              from saved Firestore records without fabricated metrics.
            </p>
          </div>
        </div>
      </section>

      <section id="about-team" className="bg-white border-t border-slate-200 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
                <GraduationCap className="w-4 h-4" />
                Academic Project Team
              </div>
              <h2 className="text-2xl font-bold text-slate-900">About QuotePilot AI</h2>
              <p className="mt-1 text-sm text-slate-600">
                Built as a complete full-stack SaaS product for <strong>FoCP (CSE-1003)</strong>.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              FoCP (CSE-1003)
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.scholarNo}
                className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center shrink-0">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Scholar No. {member.scholarNo}</p>
                  <p className="text-[11px] text-blue-700 font-medium mt-1.5">FoCP (CSE-1003)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        QuotePilot AI — Turn Every Inquiry Into an Opportunity • FoCP (CSE-1003)
      </footer>
    </div>
  );
}
`;

files['src/pages/AuthPage.jsx'] = `import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
              {mode === 'register' ? 'Create Account' : 'Sign In'}
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

files['src/pages/OnboardingPage.jsx'] = `import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createBusinessProfile } from '../services/firestoreService';
import { CURRENCIES, DEFAULT_CLEANING_SERVICES, INDUSTRY_OPTIONS } from '../utils/formatters';
import { AlertBanner, Button, Card } from '../components/UI';

export default function OnboardingPage() {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();

  const [ownerName, setOwnerName] = useState(user?.displayName || '');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Residential Cleaning');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState(8);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [services, setServices] = useState(DEFAULT_CLEANING_SERVICES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (business) navigate('/app/dashboard', { replace: true });
  }, [business, navigate]);

  const updateService = (idx, field, val) => {
    setServices((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: field === 'price' ? Number(val) : val } : s))
    );
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { id: 'srv_' + Date.now(), name: '', unit: 'Flat Rate', price: 0, description: '' }
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createBusinessProfile({
        user,
        businessData: {
          ownerName: ownerName.trim(),
          name: name.trim(),
          industry,
          currency,
          taxRate: Number(taxRate || 0),
          phone: phone.trim(),
          address: address.trim(),
          services: services.filter((s) => s.name.trim())
        }
      });
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create business profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Set up your business workspace</h1>
            <p className="text-sm text-slate-600 mt-1">
              Configure your company profile and real service prices so AI and quotations stay accurate.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>Sign Out</Button>
        </div>

        {error && <div className="mb-4"><AlertBanner type="error" message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Business Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Business Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="SparkleNest Home Cleaning"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Your Name</label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Owner full name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Service Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Default Tax %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Service Area / Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Austin, TX"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Service Price Catalog</h2>
                <p className="text-xs text-slate-500">Edit starter cleaning rates or add your own services.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addService}>
                <Plus className="w-3.5 h-3.5" /> Add Service
              </Button>
            </div>
            <div className="space-y-3">
              {services.map((srv, idx) => (
                <div key={srv.id} className="grid sm:grid-cols-12 gap-2 items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    className="sm:col-span-5 px-2.5 py-1.5 rounded border border-slate-300 text-sm bg-white"
                    placeholder="Service name"
                    value={srv.name}
                    onChange={(e) => updateService(idx, 'name', e.target.value)}
                  />
                  <input
                    className="sm:col-span-3 px-2.5 py-1.5 rounded border border-slate-300 text-sm bg-white"
                    placeholder="Unit (e.g. Flat Rate)"
                    value={srv.unit}
                    onChange={(e) => updateService(idx, 'unit', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="sm:col-span-3 px-2.5 py-1.5 rounded border border-slate-300 text-sm bg-white"
                    placeholder="Price"
                    value={srv.price}
                    onChange={(e) => updateService(idx, 'price', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setServices((prev) => prev.filter((_, i) => i !== idx))}
                    className="sm:col-span-1 p-1.5 text-slate-400 hover:text-rose-600 justify-self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" loading={saving}>
              Launch QuotePilot AI Workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

files['src/pages/DashboardPage.jsx'] = `import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Clock, DollarSign, Kanban, Sparkles, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { badgeColorForStage, formatCurrency, formatDate } from '../utils/formatters';
import { Badge, Button, Card, EmptyState, StatCard } from '../components/UI';

export default function DashboardPage() {
  const { business, leads, quotations, followups } = useAuth();
  const navigate = useNavigate();
  const currency = business?.currency || 'USD';

  const wonQuotesValue = quotations
    .filter((q) => q.status === 'Accepted')
    .reduce((sum, q) => sum + Number(q.total || 0), 0);

  const openPipelineValue = leads
    .filter((l) => l.stage !== 'Won' && l.stage !== 'Lost')
    .reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

  const wonLeadsCount = leads.filter((l) => l.stage === 'Won').length;
  const closedLeadsCount = leads.filter((l) => l.stage === 'Won' || l.stage === 'Lost').length;
  const winRate = closedLeadsCount > 0 ? Math.round((wonLeadsCount / closedLeadsCount) * 100) : 0;
  const pendingFollowups = followups.filter((f) => f.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live metrics calculated directly from your saved leads, quotations, and follow-ups.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => navigate('/app/leads')}>
            <Kanban className="w-4 h-4" /> Add Lead
          </Button>
          <Button onClick={() => navigate('/app/ai-intelligence')}>
            <Sparkles className="w-4 h-4" /> AI Analyze Inquiry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Inquiries"
          value={leads.length}
          hint={leads.filter((l) => l.aiAnalysis).length + ' analyzed by AI'}
          icon={Users}
          accent="blue"
        />
        <StatCard
          label="Active Pipeline"
          value={formatCurrency(openPipelineValue, currency)}
          hint="Open estimated opportunities"
          icon={DollarSign}
          accent="indigo"
        />
        <StatCard
          label="Accepted Quotes"
          value={formatCurrency(wonQuotesValue, currency)}
          hint={'Win rate: ' + winRate + '% (' + wonLeadsCount + ' won)'}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Pending Follow-ups"
          value={pendingFollowups.length}
          hint={quotations.length + ' total quotations saved'}
          icon={Clock}
          accent="amber"
        />
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Your pipeline is ready for your first inquiry"
          description="Add a real customer inquiry in Leads or analyze one directly in AI Intelligence to begin building quotations and tracking conversions."
          action={
            <Button onClick={() => navigate('/app/ai-intelligence')}>
              <Sparkles className="w-4 h-4" /> Analyze First Inquiry
            </Button>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Recent Inquiries</h2>
              <button
                onClick={() => navigate('/app/leads')}
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                View Pipeline <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 6).map((lead) => (
                <div key={lead.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{lead.customerName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {lead.serviceRequested || 'Service inquiry'} • {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {lead.aiAnalysis?.score !== undefined && (
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        AI {lead.aiAnalysis.score}/100
                      </span>
                    )}
                    <Badge className={badgeColorForStage(lead.stage)}>{lead.stage}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Upcoming Follow-ups</h2>
              <button
                onClick={() => navigate('/app/follow-ups')}
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {pendingFollowups.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No pending follow-ups scheduled.</p>
            ) : (
              <div className="space-y-3">
                {pendingFollowups.slice(0, 5).map((f) => (
                  <div key={f.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{f.leadName || 'Customer'}</p>
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Due {formatDate(f.dueDate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{f.note || f.channel}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
`;

files['src/pages/LeadsPage.jsx'] = `import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Kanban, List, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addInteraction, createLead, deleteLead, updateLead } from '../services/firestoreService';
import { formatCurrency, formatDate, LEAD_STAGES, LOST_REASONS } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, EmptyState, Modal } from '../components/UI';

export default function LeadsPage() {
  const { business, leads, team, userProfile } = useAuth();
  const navigate = useNavigate();
  const currency = business?.currency || 'USD';

  const [viewMode, setViewMode] = useState('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [lostModalLead, setLostModalLead] = useState(null);
  const [lostReason, setLostReason] = useState(LOST_REASONS[0]);
  const [lostNotes, setLostNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '', address: '',
    propertySize: '', serviceRequested: '', desiredDate: '', source: 'Website Form',
    estimatedValue: '', assignedToUid: '', rawInquiry: ''
  });

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStage = stageFilter === 'All' || lead.stage === stageFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (lead.customerName || '').toLowerCase().includes(q) ||
        (lead.serviceRequested || '').toLowerCase().includes(q) ||
        (lead.rawInquiry || '').toLowerCase().includes(q) ||
        (lead.customerEmail || '').toLowerCase().includes(q);
      return matchesStage && matchesSearch;
    });
  }, [leads, search, stageFilter]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.rawInquiry.trim()) {
      setError('Customer name and inquiry message are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const assignee = team.find((m) => (m.uid || m.id) === form.assignedToUid);
      await createLead(
        business.id,
        { ...form, assignedToName: assignee ? assignee.name : '' },
        userProfile?.displayName || 'User'
      );
      setShowAdd(false);
      setForm({
        customerName: '', customerEmail: '', customerPhone: '', address: '',
        propertySize: '', serviceRequested: '', desiredDate: '', source: 'Website Form',
        estimatedValue: '', assignedToUid: '', rawInquiry: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to save lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (lead, nextStage) => {
    if (nextStage === 'Lost') {
      setLostModalLead(lead);
      return;
    }
    await updateLead(business.id, lead.id, { stage: nextStage });
    if (lead.customerId) {
      await addInteraction(business.id, {
        customerId: lead.customerId,
        leadId: lead.id,
        type: 'Stage',
        title: 'Pipeline stage moved to ' + nextStage,
        createdBy: userProfile?.displayName || 'User'
      });
    }
  };

  const confirmLostDeal = async (e) => {
    e.preventDefault();
    if (!lostModalLead) return;
    await updateLead(business.id, lostModalLead.id, {
      stage: 'Lost',
      lostReason,
      lostNotes
    });
    if (lostModalLead.customerId) {
      await addInteraction(business.id, {
        customerId: lostModalLead.customerId,
        leadId: lostModalLead.id,
        type: 'Lost',
        title: 'Marked Lost (' + lostReason + ')',
        details: lostNotes,
        createdBy: userProfile?.displayName || 'User'
      });
    }
    setLostModalLead(null);
    setLostNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer inquiries from initial capture to won or lost.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> New Customer Inquiry
        </Button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, service, or inquiry..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
          >
            <option value="All">All Stages ({leads.length})</option>
            {LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 self-start">
          <button
            onClick={() => setViewMode('kanban')}
            className={'px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ' + (viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600')}
          >
            <Kanban className="w-3.5 h-3.5" /> Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={'px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ' + (viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600')}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </Card>

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="No matching leads found"
          description="Add a new customer inquiry to start qualifying and quoting."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Inquiry</Button>}
        />
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
            return (
              <div key={stage.id} className="w-72 shrink-0 bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 flex flex-col max-h-[72vh]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <Badge className={stage.color}>{stage.label}</Badge>
                  <span className="text-xs font-semibold text-slate-500">{stageLeads.length}</span>
                </div>
                <div className="space-y-3 overflow-y-auto scrollbar-thin pr-0.5">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{lead.customerName}</p>
                          <p className="text-xs text-slate-500 truncate">{lead.serviceRequested || lead.source}</p>
                        </div>
                        {lead.aiAnalysis?.tier && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 shrink-0">
                            {lead.aiAnalysis.tier} ({lead.aiAnalysis.score})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{lead.rawInquiry}</p>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>{lead.estimatedValue ? formatCurrency(lead.estimatedValue, currency) : 'Unpriced'}</span>
                        <span>{lead.assignedToName || 'Unassigned'}</span>
                      </div>

                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead, e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50"
                      >
                        {LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => navigate('/app/ai-intelligence?leadId=' + lead.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Sparkles className="w-3 h-3" /> Analyze
                        </button>
                        <button
                          onClick={() => navigate('/app/quotations?leadId=' + lead.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
                        >
                          <FileText className="w-3 h-3" /> Quote
                        </button>
                        <button
                          onClick={() => deleteLead(business.id, lead.id)}
                          title="Delete lead"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">AI Score</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {lead.customerName}
                      <div className="text-xs text-slate-500 font-normal">{lead.customerEmail || lead.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lead.serviceRequested || '—'}</td>
                    <td className="px-4 py-3">
                      {lead.aiAnalysis ? lead.aiAnalysis.score + '/100 (' + lead.aiAnalysis.tier + ')' : 'Not analyzed'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead, e.target.value)}
                        className="px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                      >
                        {LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{lead.assignedToName || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => navigate('/app/ai-intelligence?leadId=' + lead.id)}>
                        AI
                      </Button>
                      <Button size="sm" onClick={() => navigate('/app/quotations?leadId=' + lead.id)}>
                        Quote
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer Inquiry" maxWidth="max-w-2xl">
        {error && <div className="mb-3"><AlertBanner type="error" message={error} /></div>}
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name *</label>
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Maya Lin"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="maya@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Property Size / Scope</label>
              <input
                value={form.propertySize}
                onChange={(e) => setForm({ ...form, propertySize: e.target.value })}
                placeholder="3 bed, 2 bath (1,800 sq ft)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Service Requested</label>
              <input
                value={form.serviceRequested}
                onChange={(e) => setForm({ ...form, serviceRequested: e.target.value })}
                placeholder="Move-Out Deep Cleaning"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option>Website Form</option>
                <option>Google Search</option>
                <option>WhatsApp</option>
                <option>Phone Call</option>
                <option>Referral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Desired Date</label>
              <input
                type="date"
                value={form.desiredDate}
                onChange={(e) => setForm({ ...form, desiredDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assign To</label>
              <select
                value={form.assignedToUid}
                onChange={(e) => setForm({ ...form, assignedToUid: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.uid || m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street address or neighborhood"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Raw Customer Inquiry *</label>
            <textarea
              required
              rows={4}
              value={form.rawInquiry}
              onChange={(e) => setForm({ ...form, rawInquiry: e.target.value })}
              placeholder="Paste the exact email, WhatsApp message, or call notes from the customer..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Inquiry</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(lostModalLead)} onClose={() => setLostModalLead(null)} title="Record Lost Deal Reason">
        <form onSubmit={confirmLostDeal} className="space-y-4">
          <p className="text-sm text-slate-600">
            Recording why <strong>{lostModalLead?.customerName}</strong> did not convert powers your Lost Deals analytics.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Primary Lost Reason</label>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={lostNotes}
              onChange={(e) => setLostNotes(e.target.value)}
              placeholder="Any pricing feedback or competitor details..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setLostModalLead(null)}>Cancel</Button>
            <Button type="submit" variant="danger">Save as Lost</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
`;

files['src/pages/AiIntelligencePage.jsx'] = `import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Check, CheckCircle2, Clock, Copy, FileText, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeInquiryWithAI } from '../services/aiService';
import {
  addInteraction, createFollowUp, createLead, incrementUsage, updateLead
} from '../services/firestoreService';
import { AlertBanner, Badge, Button, Card } from '../components/UI';

export default function AiIntelligencePage() {
  const {
    business, leads, userProfile, selectedAiModel, aiCallsUsed, planLimits
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedLeadId, setSelectedLeadId] = useState(searchParams.get('leadId') || '');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [propertySize, setPropertySize] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [rawInquiry, setRawInquiry] = useState('');
  const [tone, setTone] = useState('Professional & Warm');

  const [analysis, setAnalysis] = useState(null);
  const [editableReply, setEditableReply] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const paramId = searchParams.get('leadId');
    if (paramId) setSelectedLeadId(paramId);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedLeadId) return;
    const found = leads.find((l) => l.id === selectedLeadId);
    if (found) {
      setCustomerName(found.customerName || '');
      setCustomerEmail(found.customerEmail || '');
      setPropertySize(found.propertySize || '');
      setDesiredDate(found.desiredDate || '');
      setRawInquiry(found.rawInquiry || '');
      if (found.aiAnalysis) {
        setAnalysis(found.aiAnalysis);
        setEditableReply(found.aiAnalysis.suggestedReply || '');
      } else {
        setAnalysis(null);
        setEditableReply('');
      }
    }
  }, [selectedLeadId, leads]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');

    if (aiCallsUsed >= planLimits.aiCallsPerMonth) {
      setError('Monthly AI quota reached for your current plan. Upgrade in Subscription to continue.');
      return;
    }
    if (!rawInquiry.trim() || rawInquiry.trim().length < 5) {
      setError('Please enter a customer inquiry before running AI analysis.');
      return;
    }

    setAnalyzing(true);
    try {
      let targetLeadId = selectedLeadId;
      let targetCustomerId = leads.find((l) => l.id === selectedLeadId)?.customerId || '';

      if (!targetLeadId) {
        const created = await createLead(
          business.id,
          {
            customerName: customerName.trim() || 'Prospective Client',
            customerEmail: customerEmail.trim(),
            propertySize: propertySize.trim(),
            desiredDate,
            rawInquiry: rawInquiry.trim(),
            source: 'AI Workspace'
          },
          userProfile?.displayName || 'User'
        );
        targetLeadId = created.leadId;
        targetCustomerId = created.customerId;
        setSelectedLeadId(targetLeadId);
      }

      const res = await analyzeInquiryWithAI({
        businessName: business.name,
        industry: business.industry,
        currency: business.currency,
        services: business.services || [],
        customerName: customerName.trim() || 'Prospective Client',
        rawInquiry: rawInquiry.trim(),
        propertySize: propertySize.trim(),
        desiredDate,
        tone,
        model: selectedAiModel
      });

      const aiData = res.analysis;
      setAnalysis(aiData);
      setEditableReply(aiData.suggestedReply || '');

      const estimatedFromCatalog = (aiData.recommendedServices || []).reduce((sum, rec) => {
        const srv = (business.services || []).find(
          (s) => s.id === rec.matchedCatalogId || s.name.toLowerCase() === (rec.serviceName || '').toLowerCase()
        );
        return sum + (srv ? Number(srv.price) * Number(rec.suggestedQty || 1) : 0);
      }, 0);

      await updateLead(business.id, targetLeadId, {
        stage: aiData.score >= 65 ? 'Qualified' : 'AI Analyzed',
        aiAnalysis: aiData,
        estimatedValue: estimatedFromCatalog
      });

      await incrementUsage(business.id, business, 'ai');

      if (targetCustomerId) {
        await addInteraction(business.id, {
          customerId: targetCustomerId,
          leadId: targetLeadId,
          type: 'AI Analysis',
          title: 'Gemini Qualified Lead: ' + aiData.tier + ' (' + aiData.score + '/100)',
          details: aiData.summary,
          createdBy: 'QuotePilot AI (' + res.modelUsed + ')'
        });
      }

      setStatusMsg('Inquiry analyzed with ' + res.modelUsed + ' and saved to Firestore.');
    } catch (err) {
      setError(err.message || 'AI analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveReplyDraft = async () => {
    if (!selectedLeadId || !analysis) return;
    const updated = { ...analysis, suggestedReply: editableReply };
    await updateLead(business.id, selectedLeadId, { aiAnalysis: updated });
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (lead?.customerId) {
      await addInteraction(business.id, {
        customerId: lead.customerId,
        leadId: selectedLeadId,
        type: 'Reply Draft',
        title: 'Customer Reply Saved',
        details: editableReply,
        createdBy: userProfile?.displayName || 'User'
      });
    }
    setStatusMsg('Edited customer reply saved to lead & customer history.');
  };

  const handleScheduleFollowup = async () => {
    if (!selectedLeadId) return;
    const lead = leads.find((l) => l.id === selectedLeadId);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await createFollowUp(business.id, {
      leadId: selectedLeadId,
      customerId: lead?.customerId || '',
      leadName: lead?.customerName || customerName,
      customerEmail: lead?.customerEmail || customerEmail,
      channel: 'Email',
      dueDate: tomorrow,
      note: 'Follow up on inquiry & missing details',
      aiDraft: editableReply
    });
    setStatusMsg('Follow-up reminder scheduled for tomorrow.');
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(editableReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Server-Side Gemini Engine ({selectedAiModel})
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">AI Sales Intelligence</h1>
          <p className="text-sm text-slate-500">
            Analyze any inquiry, detect objections & missing details, draft replies, and launch a priced quotation.
          </p>
        </div>
        {selectedLeadId && analysis && (
          <Button onClick={() => navigate('/app/quotations?leadId=' + selectedLeadId)}>
            <FileText className="w-4 h-4" /> Convert to Quotation
          </Button>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {statusMsg && <AlertBanner type="success" message={statusMsg} onClose={() => setStatusMsg('')} />}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-5 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Load Existing Lead (or enter new below)</label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedLeadId(val);
                if (!val) {
                  setCustomerName(''); setCustomerEmail(''); setPropertySize('');
                  setDesiredDate(''); setRawInquiry(''); setAnalysis(null); setEditableReply('');
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">+ Create & Analyze New Inquiry</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.customerName} — {l.stage}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Property / Scope</label>
                <input
                  value={propertySize}
                  onChange={(e) => setPropertySize(e.target.value)}
                  placeholder="3 bed, 2 bath"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reply Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option>Professional & Warm</option>
                  <option>Concise & Direct</option>
                  <option>Consultative & Detailed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Inquiry Message *</label>
              <textarea
                required
                rows={6}
                value={rawInquiry}
                onChange={(e) => setRawInquiry(e.target.value)}
                placeholder="Example: Hi! Moving out of my 3BR apartment next Friday and need a deep clean including oven and interior windows. Can you share pricing? Another company quoted $220."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <Button type="submit" loading={analyzing} className="w-full">
              <Sparkles className="w-4 h-4" />
              {analyzing ? 'Analyzing with Gemini...' : 'Run AI Sales Analysis'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-7 space-y-5">
          {!analysis ? (
            <Card className="p-10 text-center border-dashed">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Ready for AI Qualification</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Select an existing lead or paste an inquiry on the left. Gemini will return structured qualification,
                missing information, objection handling, and an editable customer response.
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Qualification Score</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-slate-900">{analysis.score}</span>
                      <span className="text-sm text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={
                      analysis.tier === 'Hot'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : analysis.tier === 'Warm'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                      Tier: {analysis.tier}
                    </Badge>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Urgency: {analysis.urgency}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p><strong>Summary:</strong> {analysis.summary}</p>
                  <p><strong>Estimated Scope:</strong> {analysis.estimatedScope}</p>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Information
                  </h3>
                  {(analysis.missingInfo || []).length === 0 ? (
                    <p className="text-xs text-slate-500">All essential details provided.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {analysis.missingInfo.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Recommended Catalog Items
                  </h3>
                  {(analysis.recommendedServices || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No specific catalog items matched.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-slate-700">
                      {analysis.recommendedServices.map((rec, i) => (
                        <li key={i} className="p-2 rounded bg-slate-50 border border-slate-200/70">
                          <p className="font-semibold text-slate-900">{rec.serviceName} × {rec.suggestedQty || 1}</p>
                          <p className="text-slate-500 mt-0.5">{rec.reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              {(analysis.objections || []).length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Detected Objections & Handling Tips</h3>
                  <div className="space-y-2.5">
                    {analysis.objections.map((obj, i) => (
                      <div key={i} className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/70 text-xs">
                        <p className="font-semibold text-rose-900">Objection: {obj.objection}</p>
                        <p className="text-slate-700 mt-1"><strong>Suggested Response:</strong> {obj.responseTip}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Editable Customer Reply</h3>
                  <Button size="sm" variant="secondary" onClick={handleCopyReply}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Reply'}
                  </Button>
                </div>
                <textarea
                  rows={6}
                  value={editableReply}
                  onChange={(e) => setEditableReply(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <div className="flex flex-wrap justify-between gap-2 pt-1">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={handleSaveReplyDraft}>
                      Save Reply to History
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleScheduleFollowup}>
                      <Clock className="w-3.5 h-3.5" /> Schedule Follow-up
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => navigate('/app/quotations?leadId=' + selectedLeadId)}>
                    <FileText className="w-3.5 h-3.5" /> Build Quotation
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
`;

files['src/pages/QuotationsPage.jsx'] = `import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createQuotation, updateLead, updateQuotation } from '../services/firestoreService';
import { exportQuotationPdf } from '../utils/pdfExport';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, EmptyState, Modal } from '../components/UI';

const STATUS_BADGE = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Sent: 'bg-blue-50 text-blue-700 border-blue-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Declined: 'bg-rose-50 text-rose-700 border-rose-200'
};

export default function QuotationsPage() {
  const { business, leads, quotations, userProfile, quotesUsed, planLimits } = useAuth();
  const [searchParams] = useSearchParams();
  const currency = business?.currency || 'USD';

  const [showBuilder, setShowBuilder] = useState(false);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [leadId, setLeadId] = useState(searchParams.get('leadId') || '');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [title, setTitle] = useState('Cleaning Service Quotation');
  const [items, setItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(business?.taxRate || 0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(business?.terms || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const paramLeadId = searchParams.get('leadId');
    if (paramLeadId) {
      setLeadId(paramLeadId);
      setShowBuilder(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setCustomerName(lead.customerName || '');
    setCustomerEmail(lead.customerEmail || '');
    setCustomerPhone(lead.customerPhone || '');
    setCustomerAddress(lead.address || '');
    setTitle(lead.serviceRequested || 'Service Quotation');

    const recs = lead.aiAnalysis?.recommendedServices || [];
    if (recs.length > 0 && (business?.services || []).length > 0) {
      const mapped = recs.map((rec) => {
        const srv = business.services.find(
          (s) => s.id === rec.matchedCatalogId || s.name.toLowerCase() === (rec.serviceName || '').toLowerCase()
        );
        const qty = Number(rec.suggestedQty || 1);
        const unitPrice = srv ? Number(srv.price) : 0;
        return {
          description: srv ? srv.name : rec.serviceName,
          unit: srv ? srv.unit : 'Flat Rate',
          qty,
          unitPrice,
          total: qty * unitPrice
        };
      });
      setItems(mapped);
    } else if (items.length === 0 && (business?.services || []).length > 0) {
      const first = business.services[0];
      setItems([{ description: first.name, unit: first.unit, qty: 1, unitPrice: first.price, total: first.price }]);
    }
  }, [leadId, leads, business]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0), 0),
    [items]
  );
  const discounted = Math.max(0, subtotal - Number(discountAmount || 0));
  const taxAmount = (discounted * Number(taxRate || 0)) / 100;
  const total = discounted + taxAmount;

  const addCatalogItem = (srvId) => {
    const srv = (business?.services || []).find((s) => s.id === srvId);
    if (!srv) return;
    setItems((prev) => [
      ...prev,
      { description: srv.name, unit: srv.unit, qty: 1, unitPrice: Number(srv.price), total: Number(srv.price) }
    ]);
  };

  const updateItem = (idx, field, val) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [field]: field === 'qty' || field === 'unitPrice' ? Number(val) : val };
        next.total = Number(next.qty || 0) * Number(next.unitPrice || 0);
        return next;
      })
    );
  };

  const handleSaveQuote = async (e) => {
    e.preventDefault();
    setError('');
    if (quotesUsed >= planLimits.quotesPerMonth) {
      setError('Monthly quotation limit reached for your current plan.');
      return;
    }
    if (!customerName.trim() || items.length === 0) {
      setError('Customer name and at least one line item are required.');
      return;
    }
    setSaving(true);
    try {
      const linkedLead = leads.find((l) => l.id === leadId);
      const quoteNumber = (business?.quotePrefix || 'QP-') + String(quotations.length + 101);
      const issueDate = new Date().toISOString().slice(0, 10);
      const validDays = Number(business?.quoteValidityDays || 14);
      const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().slice(0, 10);

      await createQuotation(
        business.id,
        {
          quoteNumber,
          leadId: leadId || '',
          customerId: linkedLead?.customerId || '',
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          title: title.trim(),
          issueDate,
          validUntil,
          items,
          subtotal,
          discountAmount: Number(discountAmount || 0),
          taxRate: Number(taxRate || 0),
          taxAmount,
          total,
          notes,
          terms,
          status: 'Draft',
          createdBy: userProfile?.displayName || 'User'
        },
        business
      );

      if (leadId) {
        await updateLead(business.id, leadId, { estimatedValue: total });
      }
      setShowBuilder(false);
    } catch (err) {
      setError(err.message || 'Failed to save quotation.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (quote, nextStatus) => {
    await updateQuotation(business.id, quote.id, { status: nextStatus });
    if (quote.leadId) {
      if (nextStatus === 'Sent') await updateLead(business.id, quote.leadId, { stage: 'Quote Sent', estimatedValue: quote.total });
      if (nextStatus === 'Accepted') await updateLead(business.id, quote.leadId, { stage: 'Won', estimatedValue: quote.total });
      if (nextStatus === 'Declined') await updateLead(business.id, quote.leadId, { stage: 'Lost', lostReason: 'Quote Declined' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate itemized quotations from your configured pricing catalog and export professional PDFs.
          </p>
        </div>
        <Button onClick={() => {
          if (items.length === 0 && (business?.services || []).length > 0) {
            const first = business.services[0];
            setItems([{ description: first.name, unit: first.unit, qty: 1, unitPrice: Number(first.price), total: Number(first.price) }]);
          }
          setShowBuilder(true);
        }}>
          <Plus className="w-4 h-4" /> New Quotation
        </Button>
      </div>

      {quotations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations created yet"
          description="Create your first quotation from a lead or directly from your service price catalog."
          action={<Button onClick={() => setShowBuilder(true)}><Plus className="w-4 h-4" /> Create Quotation</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Quote #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{q.quoteNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{q.customerName}</div>
                      <div className="text-xs text-slate-500">{q.title}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(q.issueDate)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(q.total, currency)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={q.status || 'Draft'}
                        onChange={(e) => handleStatusChange(q, e.target.value)}
                        className="px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => setPreviewQuote(q)}>
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Button>
                      <Button size="sm" onClick={() => exportQuotationPdf(q, business)}>
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showBuilder} onClose={() => setShowBuilder(false)} title="Create Quotation" maxWidth="max-w-3xl">
        {error && <div className="mb-3"><AlertBanner type="error" message={error} /></div>}
        <form onSubmit={handleSaveQuote} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Link Lead (Optional)</label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">Standalone Quotation</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.customerName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quotation Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name *</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Line Items</h3>
              <div className="flex gap-2">
                <select
                  onChange={(e) => { if (e.target.value) { addCatalogItem(e.target.value); e.target.value = ''; } }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">+ Add from Price Catalog</option>
                  {(business?.services || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price, currency)})</option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setItems((p) => [...p, { description: '', unit: 'Flat Rate', qty: 1, unitPrice: 0, total: 0 }])}
                >
                  + Custom Row
                </Button>
              </div>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-5 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  placeholder="Service description"
                  value={it.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
                <input
                  className="col-span-2 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  placeholder="Unit"
                  value={it.unit}
                  onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  className="col-span-2 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  value={it.qty}
                  onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-2 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  className="col-span-1 text-slate-400 hover:text-rose-600 justify-self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Discount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm bg-white"
                />
              </div>
            </div>
            <div className="text-sm space-y-1.5 self-center">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Discount</span><span>- {formatCurrency(discountAmount, currency)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmount, currency)}</span></div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Total</span><span>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Terms & Conditions</label>
              <textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowBuilder(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Quotation</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(previewQuote)} onClose={() => setPreviewQuote(null)} title="Quotation Document Preview" maxWidth="max-w-3xl">
        {previewQuote && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-navy-900 text-white p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{business?.name}</h2>
                  <p className="text-xs text-slate-300 mt-1">{[business?.email, business?.phone, business?.address].filter(Boolean).join(' • ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold">Quotation</p>
                  <p className="text-lg font-bold mt-0.5">{previewQuote.quoteNumber}</p>
                  <Badge className={STATUS_BADGE[previewQuote.status] || STATUS_BADGE.Draft}>{previewQuote.status}</Badge>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Prepared For</p>
                    <p className="font-semibold text-slate-900 mt-1">{previewQuote.customerName}</p>
                    <p className="text-slate-600 text-xs">{previewQuote.customerEmail}</p>
                    <p className="text-slate-600 text-xs">{previewQuote.customerAddress}</p>
                  </div>
                  <div className="text-right text-xs text-slate-600 space-y-1">
                    <p><strong>Issue Date:</strong> {formatDate(previewQuote.issueDate)}</p>
                    <p><strong>Valid Until:</strong> {formatDate(previewQuote.validUntil)}</p>
                    <p><strong>Subject:</strong> {previewQuote.title}</p>
                  </div>
                </div>
                <table className="w-full text-sm border-t border-b border-slate-200">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Service</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(previewQuote.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.description} <span className="text-xs text-slate-400">({it.unit})</span></td>
                        <td className="py-2.5 px-3 text-right">{it.qty}</td>
                        <td className="py-2.5 px-3 text-right">{formatCurrency(it.unitPrice, currency)}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(it.total, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(previewQuote.subtotal, currency)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Discount</span><span>- {formatCurrency(previewQuote.discountAmount, currency)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Tax ({previewQuote.taxRate}%)</span><span>{formatCurrency(previewQuote.taxAmount, currency)}</span></div>
                    <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                      <span>Total</span><span>{formatCurrency(previewQuote.total, currency)}</span>
                    </div>
                  </div>
                </div>
                {previewQuote.terms && (
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-4"><strong>Terms:</strong> {previewQuote.terms}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreviewQuote(null)}>Close</Button>
              <Button onClick={() => exportQuotationPdf(previewQuote, business)}>
                <Download className="w-4 h-4" /> Export PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
`;

files['src/pages/FollowUpsPage.jsx'] = `import React, { useState } from 'react';
import { CheckCircle2, Clock, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateFollowUpDraft } from '../services/aiService';
import { addInteraction, createFollowUp, incrementUsage, updateFollowUp } from '../services/firestoreService';
import { formatDate } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, EmptyState, Modal } from '../components/UI';

export default function FollowUpsPage() {
  const { business, leads, quotations, followups, userProfile, selectedAiModel } = useAuth();
  const [filter, setFilter] = useState('Pending');
  const [showAdd, setShowAdd] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [channel, setChannel] = useState('Email');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const filtered = followups.filter((f) => filter === 'All' || f.status === filter);

  const handleGenerateDraft = async () => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) {
      setError('Select a lead first to generate an AI follow-up draft.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const quote = quotations.find((q) => q.leadId === lead.id);
      const res = await generateFollowUpDraft({
        businessName: business.name,
        customerName: lead.customerName,
        serviceRequested: lead.serviceRequested,
        quoteTotal: quote?.total || lead.estimatedValue || '',
        currency: business.currency,
        channel,
        note,
        model: selectedAiModel
      });
      const text = (res.draft?.subject ? 'Subject: ' + res.draft.subject + '\\n\\n' : '') + (res.draft?.message || '');
      setAiDraft(text);
      await incrementUsage(business.id, business, 'ai');
    } catch (err) {
      setError(err.message || 'Could not generate follow-up draft.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === leadId);
    await createFollowUp(business.id, {
      leadId: lead?.id || '',
      customerId: lead?.customerId || '',
      leadName: lead?.customerName || 'General Follow-up',
      customerEmail: lead?.customerEmail || '',
      customerPhone: lead?.customerPhone || '',
      channel,
      dueDate,
      note,
      aiDraft
    });
    setShowAdd(false);
    setNote('');
    setAiDraft('');
  };

  const toggleComplete = async (f) => {
    const nextStatus = f.status === 'Completed' ? 'Pending' : 'Completed';
    await updateFollowUp(business.id, f.id, { status: nextStatus });
    if (nextStatus === 'Completed' && f.customerId) {
      await addInteraction(business.id, {
        customerId: f.customerId,
        leadId: f.leadId || '',
        type: 'Follow-up',
        title: f.channel + ' Follow-up Completed',
        details: f.note || f.aiDraft || '',
        createdBy: userProfile?.displayName || 'User'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-up Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">Never drop a warm inquiry. Schedule reminders and generate AI follow-up messages.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Schedule Follow-up
        </Button>
      </div>

      <div className="flex gap-2">
        {['Pending', 'Completed', 'All'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={'px-3.5 py-1.5 rounded-lg text-xs font-medium border ' + (filter === tab ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200')}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={'No ' + filter.toLowerCase() + ' follow-ups'}
          description="Schedule follow-ups after sending replies or quotations to maximize close rates."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Follow-up</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <Card key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900 text-sm">{f.leadName}</p>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">{f.channel}</Badge>
                  <Badge className={f.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                    {f.status} • Due {formatDate(f.dueDate)}
                  </Badge>
                </div>
                {f.note && <p className="text-xs text-slate-600">{f.note}</p>}
                {f.aiDraft && (
                  <pre className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-sans">
                    {f.aiDraft}
                  </pre>
                )}
              </div>
              <Button
                size="sm"
                variant={f.status === 'Completed' ? 'secondary' : 'primary'}
                onClick={() => toggleComplete(f)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {f.status === 'Completed' ? 'Reopen' : 'Mark Completed'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Schedule Follow-up">
        {error && <div className="mb-3"><AlertBanner type="error" message={error} /></div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lead / Customer</label>
            <select
              required
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">Select a lead...</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.customerName} ({l.stage})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option>Email</option>
                <option>WhatsApp</option>
                <option>Phone Call</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reminder Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Check if they reviewed quotation & confirm Friday slot"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Message Draft</label>
              <Button type="button" size="sm" variant="secondary" loading={generating} onClick={handleGenerateDraft}>
                <Sparkles className="w-3.5 h-3.5" /> Generate with AI
              </Button>
            </div>
            <textarea
              rows={4}
              value={aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              placeholder="Click 'Generate with AI' or write your own follow-up draft..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Save Follow-up</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
`;

let count = 0;
for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  count++;
  console.log('Created:', relPath);
}
console.log('\nPart 2 complete! Created ' + count + ' files.');