import fs from 'node:fs';
import path from 'node:path';

const files = {};

files['firestore.rules'] = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
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

files['server/index.js'] = `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3001;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const ALLOWED_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite'
]);

async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const webApiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!webApiKey) {
    if (process.env.ALLOW_UNVERIFIED_LOCAL_DEV === 'true') {
      req.authUser = { uid: 'local-dev', email: 'dev@local' };
      return next();
    }
    return res.status(500).json({
      error: 'Server setup required: set FIREBASE_WEB_API_KEY in server/.env to verify Firebase tokens.'
    });
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing Firebase Authorization Bearer token.' });
  }

  try {
    const verifyRes = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(webApiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      }
    );
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.users || !verifyData.users.length) {
      return res.status(401).json({ error: 'Invalid or expired Firebase session token.' });
    }
    req.authUser = {
      uid: verifyData.users[0].localId,
      email: verifyData.users[0].email || ''
    };
    return next();
  } catch (err) {
    return res.status(502).json({ error: 'Token verification failed: ' + err.message });
  }
}

function cleanJsonText(raw) {
  let s = (raw || '').trim();
  if (s.startsWith('\`\`\`')) {
    s = s.replace(/^\`\`\`(?:json)?\\s*/i, '').replace(/\`\`\`\\s*$/, '').trim();
  }
  return s;
}

async function callGeminiJSON({ prompt, systemInstruction, requestedModel }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_server_side_gemini_api_key') {
    const error = new Error('GEMINI_API_KEY is not configured in server/.env.');
    error.statusCode = 503;
    throw error;
  }

  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;
  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(model) +
    ':generateContent';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const msg = payload?.error?.message || 'Gemini API error (' + response.status + ')';
    const err = new Error(msg);
    err.statusCode = response.status === 429 ? 429 : 502;
    throw err;
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Gemini returned an empty response.');
    err.statusCode = 502;
    throw err;
  }

  try {
    return { data: JSON.parse(cleanJsonText(text)), modelUsed: model };
  } catch {
    const err = new Error('Gemini returned invalid JSON.');
    err.statusCode = 502;
    throw err;
  }
}

app.get('/api/health', (req, res) => {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_server_side_gemini_api_key'
  );
  res.json({
    ok: true,
    geminiConfigured,
    authVerificationConfigured: Boolean(process.env.FIREBASE_WEB_API_KEY),
    defaultModel: DEFAULT_MODEL,
    availableModels: Array.from(ALLOWED_MODELS),
    integrations: {
      email: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      whatsapp: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      billing: Boolean(process.env.STRIPE_SECRET_KEY)
    }
  });
});

app.post('/api/ai/analyze', verifyAuth, async (req, res) => {
  try {
    const {
      businessName, industry, currency, services,
      customerName, rawInquiry, propertySize, desiredDate, tone, model
    } = req.body || {};

    if (!rawInquiry || typeof rawInquiry !== 'string' || rawInquiry.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a customer inquiry (minimum 5 characters).' });
    }

    const catalogSummary = Array.isArray(services) && services.length > 0
      ? services.map((s) => '- ID: ' + s.id + ' | Name: ' + s.name + ' | Unit: ' + s.unit + ' | Price: ' + s.price + ' ' + (currency || 'USD')).join('\\n')
      : 'No services configured yet.';

    const systemInstruction =
      'You are QuotePilot AI, a sales qualification and quoting assistant for ' +
      (industry || 'Residential Cleaning') +
      ' businesses. Never invent prices outside the catalog. Return ONLY valid JSON.';

    const prompt = [
      'Business: ' + (businessName || 'Service Business'),
      'Industry: ' + (industry || 'Residential Cleaning'),
      'Currency: ' + (currency || 'USD'),
      'Service Catalog:',
      catalogSummary,
      '',
      'Customer Name: ' + (customerName || 'Prospective Client'),
      'Property/Scope Info: ' + (propertySize || 'Not specified'),
      'Desired Date: ' + (desiredDate || 'Not specified'),
      'Reply Tone: ' + (tone || 'Professional & Warm'),
      'Customer Inquiry:',
      rawInquiry.trim(),
      '',
      'Return JSON with exact keys:',
      '{',
      '  "score": number (0-100),',
      '  "tier": "Hot" | "Warm" | "Cold",',
      '  "urgency": "High" | "Medium" | "Low",',
      '  "summary": "2-sentence summary of customer request",',
      '  "estimatedScope": "Concise scope estimate from stated facts",',
      '  "recommendedServices": [{ "matchedCatalogId": "string", "serviceName": "string", "suggestedQty": number, "reason": "string" }],',
      '  "missingInfo": ["specific missing detail needed before final quote"],',
      '  "objections": [{ "objection": "string", "responseTip": "string" }],',
      '  "suggestedReply": "Editable reply addressing inquiry, asking for missing details, and proposing next steps"',
      '}'
    ].join('\\n');

    const result = await callGeminiJSON({ prompt, systemInstruction, requestedModel: model });
    return res.json({ analysis: result.data, modelUsed: result.modelUsed });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/ai/followup', verifyAuth, async (req, res) => {
  try {
    const { businessName, customerName, serviceRequested, quoteTotal, currency, channel, note, tone, model } = req.body || {};
    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }
    const systemInstruction =
      'You are QuotePilot AI. Write a concise follow-up message for a service business. Return ONLY JSON: { "subject": string, "message": string }.';
    const prompt = [
      'Business: ' + (businessName || 'Service Business'),
      'Customer: ' + customerName,
      'Service: ' + (serviceRequested || 'Cleaning service'),
      'Quoted Amount: ' + (quoteTotal ? quoteTotal + ' ' + (currency || 'USD') : 'Not quoted yet'),
      'Channel: ' + (channel || 'Email'),
      'Tone: ' + (tone || 'Friendly & Professional'),
      'Context Note: ' + (note || 'Following up on inquiry or quotation'),
      'Return JSON { "subject": "...", "message": "..." }.'
    ].join('\\n');
    const result = await callGeminiJSON({ prompt, systemInstruction, requestedModel: model });
    return res.json({ draft: result.data, modelUsed: result.modelUsed });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/ai/lost-insights', verifyAuth, async (req, res) => {
  try {
    const { businessName, lostDeals, currency, model } = req.body || {};
    if (!Array.isArray(lostDeals) || lostDeals.length === 0) {
      return res.status(400).json({ error: 'At least one lost deal record is required.' });
    }
    const digest = lostDeals.slice(0, 25).map((d, i) =>
      (i + 1) + '. Reason: ' + (d.lostReason || 'Unspecified') +
      ' | Value: ' + (d.estimatedValue || 0) + ' ' + (currency || 'USD') +
      ' | Service: ' + (d.serviceRequested || 'General') +
      ' | Notes: ' + (d.lostNotes || 'None')
    ).join('\\n');
    const systemInstruction =
      'Analyze real lost sales records and give practical, non-fabricated advice. Return ONLY JSON: { "topPatterns": string[], "pricingAdvice": string, "processImprovements": string[] }.';
    const prompt = 'Business: ' + (businessName || 'Service Business') + '\\nLost Deals:\\n' + digest;
    const result = await callGeminiJSON({ prompt, systemInstruction, requestedModel: model });
    return res.json({ insights: result.data, modelUsed: result.modelUsed });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/billing/create-checkout-session', verifyAuth, async (req, res) => {
  try {
    const { planKey, businessId, successUrl, cancelUrl } = req.body || {};
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return res.status(503).json({
        error: 'Payment gateway not configured: set STRIPE_SECRET_KEY, STRIPE_PRICE_GROWTH, and STRIPE_PRICE_PRO in server/.env before paid upgrades can be processed.'
      });
    }

    const priceMap = {
      growth: process.env.STRIPE_PRICE_GROWTH,
      pro: process.env.STRIPE_PRICE_PRO
    };
    const priceId = priceMap[planKey];
    if (!priceId) {
      return res.status(400).json({
        error: 'Missing Stripe Price ID for plan "' + planKey + '" in server/.env.'
      });
    }

    const params = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: successUrl || 'https://quotepilot-ai-7b4da.web.app/app/subscription?checkout=success',
      cancel_url: cancelUrl || 'https://quotepilot-ai-7b4da.web.app/app/subscription?checkout=cancelled',
      client_reference_id: businessId || ''
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + stripeKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || !session.url) {
      return res.status(502).json({ error: session?.error?.message || 'Failed to create Stripe checkout session.' });
    }
    return res.json({ checkoutUrl: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('QuotePilot AI server listening on http://localhost:' + PORT);
});
`;

files['src/pages/SubscriptionPage.jsx'] = `import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { checkBackendHealth } from '../services/aiService';
import { PLAN_LIMITS } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, Modal } from '../components/UI';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function SubscriptionPage() {
  const { business, aiCallsUsed, quotesUsed, team, planLimits } = useAuth();
  const [billingReady, setBillingReady] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [modalPlan, setModalPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentPlan = business?.plan || 'starter';

  useEffect(() => {
    checkBackendHealth()
      .then((data) => setBillingReady(Boolean(data?.integrations?.billing)))
      .catch(() => setBillingReady(false))
      .finally(() => setLoadingHealth(false));
  }, []);

  const handleUpgradeClick = async (planKey, plan) => {
    setErrorMsg('');
    if (planKey === 'starter' || planKey === currentPlan) return;

    if (!billingReady) {
      setModalPlan({ key: planKey, ...plan });
      return;
    }

    setCheckoutLoading(planKey);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch(API_BASE + '/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({
          planKey,
          businessId: business?.id || '',
          successUrl: window.location.origin + '/app/subscription?checkout=success',
          cancelUrl: window.location.origin + '/app/subscription?checkout=cancelled'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Checkout session could not be created.');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setErrorMsg(err.message || 'Payment checkout failed.');
    } finally {
      setCheckoutLoading('');
    }
  };

  const aiPct = Math.min(100, Math.round((aiCallsUsed / planLimits.aiCallsPerMonth) * 100));
  const quotePct = Math.min(100, Math.round((quotesUsed / planLimits.quotesPerMonth) * 100));
  const teamPct = Math.min(100, Math.round((team.length / planLimits.maxTeamMembers) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription & Usage Limits</h1>
        <p className="text-sm text-slate-500 mt-1">
          Usage limits are enforced in real time. Paid plan upgrades require verified payment checkout.
        </p>
      </div>

      {!loadingHealth && !billingReady && (
        <AlertBanner
          type="warning"
          title="Payment Gateway Required for Paid Upgrades"
          message="Your workspace is protected against unpaid plan switching. Configure STRIPE_SECRET_KEY, STRIPE_PRICE_GROWTH, STRIPE_PRICE_PRO, and a webhook on the backend to accept real subscription payments."
        />
      )}

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
            <span>Monthly AI Analyses</span>
            <span className="font-semibold text-slate-900">{aiCallsUsed} / {planLimits.aiCallsPerMonth}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: aiPct + '%' }} />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
            <span>Monthly Quotations</span>
            <span className="font-semibold text-slate-900">{quotesUsed} / {planLimits.quotesPerMonth}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: quotePct + '%' }} />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
            <span>Team Members</span>
            <span className="font-semibold text-slate-900">{team.length} / {planLimits.maxTeamMembers}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: teamPct + '%' }} />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {Object.entries(PLAN_LIMITS).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          const isPaid = key !== 'starter';
          return (
            <Card key={key} className={'p-6 flex flex-col justify-between ' + (isCurrent ? 'border-blue-600 ring-1 ring-blue-600' : '')}>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                  {isCurrent && <Badge className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>}
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{plan.priceLabel}</p>
                <p className="text-xs text-slate-500 mt-2">{plan.description}</p>
                <ul className="mt-5 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {plan.aiCallsPerMonth} AI analyses / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {plan.quotesPerMonth} quotations / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Up to {plan.maxTeamMembers} team seats</li>
                </ul>
              </div>

              {isCurrent ? (
                <Button className="mt-6 w-full" variant="secondary" disabled>
                  Current Plan
                </Button>
              ) : isPaid ? (
                <Button
                  className="mt-6 w-full"
                  loading={checkoutLoading === key}
                  onClick={() => handleUpgradeClick(key, plan)}
                >
                  {billingReady ? <CreditCard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {billingReady ? 'Subscribe (' + plan.priceLabel + ')' : 'Upgrade — Payment Required'}
                </Button>
              ) : (
                <Button className="mt-6 w-full" variant="secondary" disabled>
                  Included Free Tier
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(modalPlan)}
        onClose={() => setModalPlan(null)}
        title={'Upgrade to ' + (modalPlan?.name || '') + ' (' + (modalPlan?.priceLabel || '') + ')'}
      >
        <div className="space-y-4 text-sm text-slate-700">
          <AlertBanner
            type="warning"
            title="Checkout Blocked — Billing Credentials Not Configured"
            message="QuotePilot AI does not allow switching to paid plans without a verified payment. No charge was made and your account remains on Starter Free."
          />
          <p className="text-xs text-slate-600">
            To enable real paid upgrades for your customers:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Add <code className="px-1 bg-slate-100 rounded">STRIPE_SECRET_KEY</code>, <code className="px-1 bg-slate-100 rounded">STRIPE_PRICE_GROWTH</code>, and <code className="px-1 bg-slate-100 rounded">STRIPE_PRICE_PRO</code> in <code className="px-1 bg-slate-100 rounded">server/.env</code>.</li>
            <li>Connect a Stripe webhook (<code className="px-1 bg-slate-100 rounded">checkout.session.completed</code>) using Firebase Admin SDK to update the business <code className="px-1 bg-slate-100 rounded">plan</code> field after payment succeeds.</li>
          </ol>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setModalPlan(null)}>Understood</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
`;

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relPath);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Updated:', relPath);
}
console.log('Billing security fix applied!');