import React from 'react';
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
