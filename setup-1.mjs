import fs from 'node:fs';
import path from 'node:path';

const files = {};

files['package.json'] = `{
  "name": "quotepilot-ai",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "setup": "npm install && npm --prefix server install",
    "dev": "concurrently -n WEB,API -c blue,magenta \\"vite\\" \\"node server/index.js\\"",
    "client": "vite",
    "server": "node server/index.js",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "firebase": "^10.14.1",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",
    "lucide-react": "^0.454.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "recharts": "^2.13.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "vite": "^5.4.10"
  }
}
`;

files['vite.config.js'] = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
`;

files['tailwind.config.js'] = `export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D1A',
          900: '#0B1324',
          800: '#13203B',
          700: '#1D2F54'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
`;

files['postcss.config.js'] = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`;

files['index.html'] = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QuotePilot AI — Turn Every Inquiry Into an Opportunity</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

files['.gitignore'] = `node_modules
server/node_modules
functions/node_modules
dist
.env
server/.env
.firebase
*.log
`;

files['.env.example'] = `# Public Firebase Web App config (safe for frontend; NEVER put Gemini keys here)
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: set only if backend is deployed separately (e.g. Render/Railway)
# VITE_API_BASE_URL=https://your-quotepilot-api.onrender.com
`;

files['firebase.json'] = `{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
`;

files['.firebaserc.example'] = `{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
`;

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
      allow create: if isSignedIn() && request.resource.data.ownerUid == request.auth.uid;
      allow read, update, delete: if belongsToBusiness(businessId);

      match /{subcollection}/{docId} {
        allow read, write: if belongsToBusiness(businessId);
      }
    }
  }
}
`;

files['firestore.indexes.json'] = `{
  "indexes": [],
  "fieldOverrides": []
}
`;

files['server/package.json'] = `{
  "name": "quotepilot-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1"
  }
}
`;

files['server/.env.example'] = `PORT=3001
# Required: Free key from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_server_side_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash

# Recommended: Same Firebase Web API Key to verify Firebase Auth ID tokens server-side
FIREBASE_WEB_API_KEY=your_firebase_web_api_key

# Set to true ONLY for local dev if FIREBASE_WEB_API_KEY is not set yet
ALLOW_UNVERIFIED_LOCAL_DEV=false

# Optional external providers (leave empty if unconfigured)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
STRIPE_SECRET_KEY=
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

app.listen(PORT, () => {
  console.log('QuotePilot AI server listening on http://localhost:' + PORT);
});
`;

files['functions/package.json'] = `{
  "name": "quotepilot-functions",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": "20" },
  "dependencies": { "firebase-functions": "^6.0.1" }
}
`;

files['functions/index.js'] = `import { onRequest } from 'firebase-functions/v2/https';

export const health = onRequest((req, res) => {
  res.json({
    ok: true,
    note: 'Optional Firebase Blaze Functions endpoint. On Spark free tier, run server/index.js.'
  });
});
`;

files['src/index.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background-color: #f8fafc;
    color: #0f172a;
  }
}

.scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 9999px; }
`;

files['src/main.jsx'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

files['src/firebase/config.js'] = `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_firebase_web_api_key'
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
`;

files['src/utils/formatters.js'] = `export const CURRENCIES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'INR', label: 'INR (Rs.)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'EUR', label: 'EUR (€)' }
];

export const INDUSTRY_OPTIONS = [
  'Residential Cleaning',
  'Commercial Cleaning',
  'Deep & Move-Out Cleaning',
  'Landscaping & Lawn Care',
  'HVAC & Home Maintenance',
  'Pest Control',
  'General Home Services'
];

export const DEFAULT_CLEANING_SERVICES = [
  {
    id: 'srv_std_clean',
    name: 'Standard Residential Cleaning',
    unit: 'Flat Rate',
    price: 120,
    description: 'Kitchen, bathrooms, bedrooms, dusting, vacuuming, and mopping'
  },
  {
    id: 'srv_deep_clean',
    name: 'Deep Cleaning Package',
    unit: 'Flat Rate',
    price: 240,
    description: 'Baseboards, inside cabinets & appliances, grout & sanitization'
  },
  {
    id: 'srv_move_clean',
    name: 'Move-In / Move-Out Cleaning',
    unit: 'Flat Rate',
    price: 310,
    description: 'Full empty-home turnaround clean ready for inspection'
  },
  {
    id: 'srv_hourly',
    name: 'Extra Cleaner Labor',
    unit: 'Per Hour',
    price: 45,
    description: 'Additional labor hours for larger homes or custom requests'
  },
  {
    id: 'srv_windows',
    name: 'Interior Window & Track Detailing',
    unit: 'Per Room',
    price: 18,
    description: 'Interior glass, sills, and tracks per room'
  }
];

export const LEAD_STAGES = [
  { id: 'New Inquiry', label: 'New Inquiry', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'AI Analyzed', label: 'AI Analyzed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'Qualified', label: 'Qualified', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Quote Sent', label: 'Quote Sent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Won', label: 'Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Lost', label: 'Lost', color: 'bg-rose-50 text-rose-700 border-rose-200' }
];

export const LOST_REASONS = [
  'Price Too High',
  'No Response / Ghosted',
  'Chose Competitor',
  'Schedule Unavailable',
  'Out of Service Area',
  'Scope Changed / Cancelled',
  'Other'
];

export const PLAN_LIMITS = {
  starter: {
    name: 'Starter Free',
    priceLabel: '$0 / month',
    aiCallsPerMonth: 25,
    quotesPerMonth: 20,
    maxTeamMembers: 2,
    description: 'For independent service owners testing AI lead qualification.'
  },
  growth: {
    name: 'Growth',
    priceLabel: '$29 / month',
    aiCallsPerMonth: 250,
    quotesPerMonth: 200,
    maxTeamMembers: 6,
    description: 'For growing residential cleaning teams with active pipelines.'
  },
  pro: {
    name: 'Pro Studio',
    priceLabel: '$79 / month',
    aiCallsPerMonth: 1500,
    quotesPerMonth: 2000,
    maxTeamMembers: 25,
    description: 'High-volume multi-crew operations and full reporting.'
  }
};

export function formatCurrency(amount, currencyCode = 'USD') {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2
    }).format(num);
  } catch {
    return (currencyCode || 'USD') + ' ' + num.toFixed(2);
  }
}

export function formatDate(value) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return y + '-' + m;
}

export function badgeColorForStage(stage) {
  const found = LEAD_STAGES.find((s) => s.id === stage);
  return found ? found.color : 'bg-slate-100 text-slate-700 border-slate-200';
}
`;

files['src/utils/pdfExport.js'] = `import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

export function exportQuotationPdf(quote, business) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const currency = business?.currency || 'USD';

  doc.setFillColor(11, 19, 36);
  doc.rect(0, 0, 595, 108, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(business?.name || 'QuotePilot AI Business', 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  const contactLine = [business?.email, business?.phone, business?.address].filter(Boolean).join('  |  ');
  if (contactLine) doc.text(contactLine, 40, 64);
  doc.text(business?.industry || 'Residential Cleaning Services', 40, 80);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('QUOTATION', 555, 44, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.quoteNumber || 'QP-0001', 555, 64, { align: 'right' });
  doc.text('Status: ' + (quote.status || 'Draft'), 555, 80, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PREPARED FOR', 40, 140);
  doc.setFontSize(12);
  doc.text(quote.customerName || 'Valued Customer', 40, 158);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  let yCust = 174;
  if (quote.customerEmail) { doc.text(quote.customerEmail, 40, yCust); yCust += 14; }
  if (quote.customerPhone) { doc.text(quote.customerPhone, 40, yCust); yCust += 14; }
  if (quote.customerAddress) { doc.text(quote.customerAddress, 40, yCust); }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('QUOTE DETAILS', 380, 140);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Issue Date: ' + formatDate(quote.issueDate), 380, 158);
  doc.text('Valid Until: ' + formatDate(quote.validUntil), 380, 174);
  if (quote.title) doc.text('Subject: ' + quote.title, 380, 190);

  const rows = (quote.items || []).map((item) => [
    item.description || 'Service Item',
    item.unit || 'Flat Rate',
    String(item.qty || 1),
    formatCurrency(item.unitPrice, currency),
    formatCurrency(item.total, currency)
  ]);

  autoTable(doc, {
    startY: 225,
    head: [['Service / Description', 'Unit', 'Qty', 'Unit Price', 'Amount']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9.5 },
    bodyStyles: { fontSize: 9.5, textColor: [15, 23, 42] },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: { left: 40, right: 40 }
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 24 : 360;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal', 390, finalY);
  doc.text(formatCurrency(quote.subtotal, currency), 555, finalY, { align: 'right' });
  doc.text('Discount', 390, finalY + 18);
  doc.text('- ' + formatCurrency(quote.discountAmount, currency), 555, finalY + 18, { align: 'right' });
  doc.text('Tax (' + (quote.taxRate || 0) + '%)', 390, finalY + 36);
  doc.text(formatCurrency(quote.taxAmount, currency), 555, finalY + 36, { align: 'right' });
  doc.setDrawColor(203, 213, 225);
  doc.line(390, finalY + 46, 555, finalY + 46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(11, 19, 36);
  doc.text('Total', 390, finalY + 64);
  doc.text(formatCurrency(quote.total, currency), 555, finalY + 64, { align: 'right' });

  let notesY = finalY + 95;
  if (quote.notes) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42);
    doc.text('Notes', 40, notesY);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    const wrapped = doc.splitTextToSize(quote.notes, 515);
    doc.text(wrapped, 40, notesY + 14);
    notesY += 18 + wrapped.length * 12;
  }
  if (quote.terms) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42);
    doc.text('Terms & Conditions', 40, notesY);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    const wrappedTerms = doc.splitTextToSize(quote.terms, 515);
    doc.text(wrappedTerms, 40, notesY + 14);
  }

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated by QuotePilot AI — Turn Every Inquiry Into an Opportunity', 40, 810);
  doc.save((quote.quoteNumber || 'quotation') + '.pdf');
}
`;

files['src/services/firestoreService.js'] = `import {
  addDoc, collection, deleteDoc, doc, getDocs, increment,
  onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getMonthKey } from '../utils/formatters';

export async function createBusinessProfile({ user, businessData }) {
  const businessRef = doc(collection(db, 'businesses'));
  const businessId = businessRef.id;
  const monthKey = getMonthKey();

  await setDoc(businessRef, {
    id: businessId,
    ownerUid: user.uid,
    name: businessData.name,
    industry: businessData.industry || 'Residential Cleaning',
    phone: businessData.phone || '',
    email: businessData.email || user.email,
    address: businessData.address || '',
    website: businessData.website || '',
    currency: businessData.currency || 'USD',
    taxRate: Number(businessData.taxRate || 0),
    quotePrefix: businessData.quotePrefix || 'QP-',
    quoteValidityDays: Number(businessData.quoteValidityDays || 14),
    terms: businessData.terms || '50% deposit upon booking, balance due upon completion. 24-hour satisfaction guarantee.',
    services: businessData.services || [],
    plan: 'starter',
    usage: {
      aiCallsMonthKey: monthKey,
      aiCallsCount: 0,
      quotesMonthKey: monthKey,
      quotesCount: 0
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: businessData.ownerName || user.displayName || user.email.split('@')[0],
    businessId,
    role: 'Owner',
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, 'businesses', businessId, 'team'), {
    uid: user.uid,
    name: businessData.ownerName || user.displayName || user.email.split('@')[0],
    email: user.email,
    role: 'Owner',
    status: 'Active',
    createdAt: serverTimestamp()
  });

  return businessId;
}

export async function updateBusinessProfile(businessId, updates) {
  await updateDoc(doc(db, 'businesses', businessId), { ...updates, updatedAt: serverTimestamp() });
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, 'users', uid), updates);
}

export function subscribeBusiness(businessId, callback) {
  return onSnapshot(doc(db, 'businesses', businessId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function subscribeCollection(businessId, subcollection, callback, sortField = 'createdAt') {
  const q = query(collection(db, 'businesses', businessId, subcollection), orderBy(sortField, 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function upsertCustomer(businessId, customerData) {
  const customersRef = collection(db, 'businesses', businessId, 'customers');
  if (customerData.id) {
    await updateDoc(doc(customersRef, customerData.id), { ...customerData, updatedAt: serverTimestamp() });
    return customerData.id;
  }
  if (customerData.email) {
    const q = query(customersRef, where('email', '==', customerData.email.trim().toLowerCase()));
    const existing = await getDocs(q);
    if (!existing.empty) {
      const existingId = existing.docs[0].id;
      await updateDoc(doc(customersRef, existingId), {
        name: customerData.name,
        phone: customerData.phone || existing.docs[0].data().phone || '',
        address: customerData.address || existing.docs[0].data().address || '',
        propertySize: customerData.propertySize || existing.docs[0].data().propertySize || '',
        updatedAt: serverTimestamp()
      });
      return existingId;
    }
  }
  const created = await addDoc(customersRef, {
    businessId,
    name: customerData.name || 'Unnamed Customer',
    email: (customerData.email || '').trim().toLowerCase(),
    phone: customerData.phone || '',
    address: customerData.address || '',
    propertySize: customerData.propertySize || '',
    notes: customerData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return created.id;
}

export async function addInteraction(businessId, interaction) {
  return addDoc(collection(db, 'businesses', businessId, 'interactions'), {
    businessId,
    customerId: interaction.customerId || '',
    leadId: interaction.leadId || '',
    type: interaction.type || 'Note',
    title: interaction.title || 'Interaction',
    details: interaction.details || '',
    createdBy: interaction.createdBy || 'System',
    createdAt: serverTimestamp()
  });
}

export async function createLead(businessId, leadData, createdByName) {
  const customerId = await upsertCustomer(businessId, {
    name: leadData.customerName,
    email: leadData.customerEmail,
    phone: leadData.customerPhone,
    address: leadData.address,
    propertySize: leadData.propertySize
  });

  const docRef = await addDoc(collection(db, 'businesses', businessId, 'leads'), {
    businessId,
    customerId,
    customerName: leadData.customerName,
    customerEmail: (leadData.customerEmail || '').trim().toLowerCase(),
    customerPhone: leadData.customerPhone || '',
    address: leadData.address || '',
    propertySize: leadData.propertySize || '',
    serviceRequested: leadData.serviceRequested || '',
    source: leadData.source || 'Website Inquiry',
    rawInquiry: leadData.rawInquiry || '',
    desiredDate: leadData.desiredDate || '',
    stage: leadData.stage || 'New Inquiry',
    assignedToUid: leadData.assignedToUid || '',
    assignedToName: leadData.assignedToName || '',
    estimatedValue: Number(leadData.estimatedValue || 0),
    aiAnalysis: null,
    lostReason: '',
    lostNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await addInteraction(businessId, {
    customerId,
    leadId: docRef.id,
    type: 'Inquiry',
    title: 'New Inquiry Captured (' + (leadData.source || 'Manual') + ')',
    details: leadData.rawInquiry || leadData.serviceRequested || 'Lead added to pipeline.',
    createdBy: createdByName
  });

  return { leadId: docRef.id, customerId };
}

export async function updateLead(businessId, leadId, updates) {
  await updateDoc(doc(db, 'businesses', businessId, 'leads', leadId), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteLead(businessId, leadId) {
  await deleteDoc(doc(db, 'businesses', businessId, 'leads', leadId));
}

export async function createQuotation(businessId, quoteData, business) {
  const quoteRef = await addDoc(collection(db, 'businesses', businessId, 'quotations'), {
    businessId,
    ...quoteData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await incrementUsage(businessId, business, 'quotes');

  if (quoteData.customerId) {
    await addInteraction(businessId, {
      customerId: quoteData.customerId,
      leadId: quoteData.leadId || '',
      type: 'Quotation',
      title: 'Quotation ' + quoteData.quoteNumber + ' Created',
      details: 'Amount: ' + quoteData.total + ' (' + (quoteData.status || 'Draft') + ')',
      createdBy: quoteData.createdBy || 'Team'
    });
  }

  return quoteRef.id;
}

export async function updateQuotation(businessId, quoteId, updates) {
  await updateDoc(doc(db, 'businesses', businessId, 'quotations', quoteId), { ...updates, updatedAt: serverTimestamp() });
}

export async function createFollowUp(businessId, data) {
  return addDoc(collection(db, 'businesses', businessId, 'followups'), {
    businessId,
    leadId: data.leadId || '',
    customerId: data.customerId || '',
    leadName: data.leadName || '',
    quoteId: data.quoteId || '',
    customerEmail: data.customerEmail || '',
    customerPhone: data.customerPhone || '',
    channel: data.channel || 'Email',
    dueDate: data.dueDate,
    note: data.note || '',
    aiDraft: data.aiDraft || '',
    status: 'Pending',
    createdAt: serverTimestamp()
  });
}

export async function updateFollowUp(businessId, followupId, updates) {
  await updateDoc(doc(db, 'businesses', businessId, 'followups', followupId), updates);
}

export async function addTeamMember(businessId, member) {
  return addDoc(collection(db, 'businesses', businessId, 'team'), {
    businessId,
    uid: '',
    name: member.name,
    email: member.email.trim().toLowerCase(),
    role: member.role || 'Sales Rep',
    status: 'Invited',
    createdAt: serverTimestamp()
  });
}

export async function deleteTeamMember(businessId, memberId) {
  await deleteDoc(doc(db, 'businesses', businessId, 'team', memberId));
}

export async function incrementUsage(businessId, business, type) {
  const monthKey = getMonthKey();
  const usage = business?.usage || {};
  const businessRef = doc(db, 'businesses', businessId);

  if (type === 'ai') {
    if (usage.aiCallsMonthKey === monthKey) {
      await updateDoc(businessRef, { 'usage.aiCallsCount': increment(1) });
    } else {
      await updateDoc(businessRef, { 'usage.aiCallsMonthKey': monthKey, 'usage.aiCallsCount': 1 });
    }
  } else if (type === 'quotes') {
    if (usage.quotesMonthKey === monthKey) {
      await updateDoc(businessRef, { 'usage.quotesCount': increment(1) });
    } else {
      await updateDoc(businessRef, { 'usage.quotesMonthKey': monthKey, 'usage.quotesCount': 1 });
    }
  }
}
`;

files['src/services/aiService.js'] = `import { auth } from '../firebase/config';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers.Authorization = 'Bearer ' + token;
  }
  return headers;
}

async function postJson(path, body) {
  const headers = await getAuthHeaders();
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'AI server error (' + res.status + ')');
  }
  return data;
}

export async function checkBackendHealth() {
  const res = await fetch(API_BASE + '/api/health');
  if (!res.ok) throw new Error('Backend server is unreachable.');
  return res.json();
}

export async function analyzeInquiryWithAI(payload) {
  return postJson('/api/ai/analyze', payload);
}

export async function generateFollowUpDraft(payload) {
  return postJson('/api/ai/followup', payload);
}

export async function analyzeLostDealsWithAI(payload) {
  return postJson('/api/ai/lost-insights', payload);
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
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setLoading(true);
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setUserProfile(snap.exists() ? snap.data() : null);
      if (!snap.exists()) {
        setBusiness(null);
        setLoading(false);
      }
    });
    return () => unsubUser();
  }, [user]);

  useEffect(() => {
    const businessId = userProfile?.businessId;
    if (!businessId) return;

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
  }, [userProfile?.businessId]);

  const currentMonth = getMonthKey();
  const planKey = business?.plan || 'starter';
  const planLimits = PLAN_LIMITS[planKey] || PLAN_LIMITS.starter;
  const aiCallsUsed = business?.usage?.aiCallsMonthKey === currentMonth ? (business?.usage?.aiCallsCount || 0) : 0;
  const quotesUsed = business?.usage?.quotesMonthKey === currentMonth ? (business?.usage?.quotesCount || 0) : 0;
  const logout = () => (auth ? signOut(auth) : Promise.resolve());

  return (
    <AuthContext.Provider
      value={{
        user, userProfile, business, leads, quotations, followups,
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

files['src/components/UI.jsx'] = `import React from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

export function Card({ children, className = '' }) {
  return (
    <div className={'bg-white border border-slate-200/80 rounded-xl shadow-sm ' + className}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, accent = 'blue' }) {
  const accentMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div className={'p-2.5 rounded-lg ' + (accentMap[accent] || accentMap.blue)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function Badge({ children, className = 'bg-slate-100 text-slate-700 border-slate-200' }) {
  return (
    <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' + className}>
      {children}
    </span>
  );
}

export function Button({
  children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', ...props
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm',
    dark: 'bg-navy-900 hover:bg-navy-800 text-white shadow-sm',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
    ghost: 'hover:bg-slate-100 text-slate-600'
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return (
    <button
      disabled={disabled || loading}
      className={
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
        (variants[variant] || variants.primary) + ' ' + (sizes[size] || sizes.md) + ' ' + className
      }
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="p-10 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}

export function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-3" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function AlertBanner({ type = 'info', title, message, onClose }) {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  const Icon = type === 'success' ? CheckCircle2 : type === 'info' ? Info : AlertCircle;
  return (
    <div className={'flex items-start gap-3 p-3.5 rounded-lg border text-sm ' + (styles[type] || styles.info)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className={title ? 'mt-0.5 text-xs opacity-90' : ''}>{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className={'w-full ' + maxWidth + ' bg-white rounded-xl shadow-xl border border-slate-200 max-h-[90vh] flex flex-col'}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
`;

files['src/components/ProtectedRoute.jsx'] = `import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './UI';

export function ProtectedRoute({ children, requireBusiness = true }) {
  const { user, business, loading, isFirebaseConfigured } = useAuth();

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

  if (requireBusiness && !business) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
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
console.log('\\nPart 1 complete! Created ' + count + ' files.');
console.log('Next: ask for Part 2 to create the remaining UI pages and App.jsx.');