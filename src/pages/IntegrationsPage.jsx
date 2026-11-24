import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkBackendHealth } from '../services/aiService';
import { AlertBanner, Badge, Button, Card } from '../components/UI';

export default function IntegrationsPage() {
  const { selectedAiModel, setSelectedAiModel } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await checkBackendHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message || 'Backend API server is not reachable. Start it with: npm run server');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrations & API Status</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live verification of server-side credentials. Secret keys are never stored in browser code.
          </p>
        </div>
        <Button variant="secondary" onClick={loadHealth} loading={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh Server Status
        </Button>
      </div>

      {error && <AlertBanner type="warning" title="Backend Server Offline" message={error} />}

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Sparkles className="w-5 h-5" /></div>
              <div>
                <h2 className="font-semibold text-slate-900">Google Gemini AI (Server-Side)</h2>
                <p className="text-xs text-slate-500">Powers lead scoring, objections, replies & follow-up drafts.</p>
              </div>
            </div>
            <Badge className={health?.geminiConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
              {health?.geminiConfigured ? 'Connected' : 'Awaiting Key'}
            </Badge>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Active Gemini Model</label>
            <select
              value={selectedAiModel}
              onChange={(e) => setSelectedAiModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Fast / Low Cost)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Configure <code className="px-1 py-0.5 bg-slate-100 rounded">GEMINI_API_KEY</code> inside <code className="px-1 py-0.5 bg-slate-100 rounded">server/.env</code>.
          </p>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <h2 className="font-semibold text-slate-900">Server Auth Token Verification</h2>
                <p className="text-xs text-slate-500">Verifies Firebase ID tokens before calling Gemini.</p>
              </div>
            </div>
            <Badge className={health?.authVerificationConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
              {health?.authVerificationConfigured ? 'Verified' : 'Needs FIREBASE_WEB_API_KEY'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Set <code className="px-1 py-0.5 bg-slate-100 rounded">FIREBASE_WEB_API_KEY</code> in <code className="px-1 py-0.5 bg-slate-100 rounded">server/.env</code> so only logged-in workspace users can call <code className="px-1 py-0.5 bg-slate-100 rounded">/api/ai/*</code>.
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Transactional Email (SMTP)</h2>
            <Badge className={health?.integrations?.email ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
              {health?.integrations?.email ? 'Configured' : 'Awaiting Credentials'}
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Requires <code className="px-1 bg-slate-100 rounded">SMTP_HOST</code>, <code className="px-1 bg-slate-100 rounded">SMTP_USER</code>, and <code className="px-1 bg-slate-100 rounded">SMTP_PASS</code> in <code className="px-1 bg-slate-100 rounded">server/.env</code>. Until configured, QuotePilot AI prepares editable drafts for one-click copying instead of falsely claiming an email was sent.
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">WhatsApp Cloud API</h2>
            <Badge className={health?.integrations?.whatsapp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
              {health?.integrations?.whatsapp ? 'Configured' : 'Awaiting Credentials'}
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Requires Meta <code className="px-1 bg-slate-100 rounded">WHATSAPP_TOKEN</code> and <code className="px-1 bg-slate-100 rounded">WHATSAPP_PHONE_NUMBER_ID</code> in <code className="px-1 bg-slate-100 rounded">server/.env</code>. QuotePilot AI never claims a WhatsApp message was delivered without an active Meta integration.
          </p>
        </Card>
      </div>
    </div>
  );
}
