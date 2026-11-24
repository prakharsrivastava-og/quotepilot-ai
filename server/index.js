import express from 'express';
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
    if (!verifyData.users[0].emailVerified) {
      return res.status(403).json({ error: 'Please verify your email address before using AI features.' });
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
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return s;
}



async function callGeminiJSON({ prompt, systemInstruction, requestedModel }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_server_side_gemini_api_key') {
    const error = new Error('GEMINI_API_KEY is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const primaryModel = ALLOWED_MODELS.has(requestedModel)
    ? requestedModel
    : DEFAULT_MODEL;

  const fallbackModel = 'gemini-3.5-flash-lite';

  async function requestModel(model) {
    const endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      encodeURIComponent(model) +
      ':generateContent';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      console.log('Gemini response status:', response.status);

      if (!response.ok) {
        const error = new Error(
          payload?.error?.message || 'Gemini API error (' + response.status + ')'
        );
        error.statusCode = response.status;
        throw error;
      }

      const responseText =
        payload?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        const error = new Error('Gemini returned an empty response.');
        error.statusCode = 502;
        throw error;
      }

      let data;

      try {
        data = JSON.parse(cleanJsonText(responseText));
      } catch {
        const error = new Error('Gemini returned invalid JSON.');
        error.statusCode = 502;
        throw error;
      }

      return { data, modelUsed: model };

    } catch (err) {
      if (err.name === 'AbortError') {
        const error = new Error('Gemini request timed out after 30 seconds.');
        error.statusCode = 504;
        throw error;
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    return await requestModel(primaryModel);
  } catch (err) {
    if (
      (err.statusCode !== 503 && err.statusCode !== 429) ||
      primaryModel === fallbackModel
    ) {
      throw err;
    }

    console.warn('Primary Gemini model unavailable. Trying fallback:', fallbackModel);

    try {
      return await requestModel(fallbackModel);
    } catch (fallbackError) {
      console.error('Gemini fallback failed:', fallbackError.message);

      const error = new Error(
        'AI is temporarily unavailable. Please try again shortly.'
      );
      error.statusCode = fallbackError.statusCode || 503;
      throw error;
    }
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
      ? services.map((s) => '- ID: ' + s.id + ' | Name: ' + s.name + ' | Unit: ' + s.unit + ' | Price: ' + s.price + ' ' + (currency || 'USD')).join('\n')
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
    ].join('\n');

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
    ].join('\n');
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
    ).join('\n');
    const systemInstruction =
      'Analyze real lost sales records and give practical, non-fabricated advice. Return ONLY JSON: { "topPatterns": string[], "pricingAdvice": string, "processImprovements": string[] }.';
    const prompt = 'Business: ' + (businessName || 'Service Business') + '\nLost Deals:\n' + digest;
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

