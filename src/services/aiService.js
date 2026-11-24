import { auth } from '../firebase/config';

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
