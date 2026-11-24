import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateBusinessProfile, updateUserProfile } from '../services/firestoreService';
import { CURRENCIES, INDUSTRY_OPTIONS } from '../utils/formatters';
import { AlertBanner, Button, Card } from '../components/UI';

export default function SettingsPage() {
  const { user, userProfile, business } = useAuth();
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [form, setForm] = useState({
    name: '', industry: 'Residential Cleaning', phone: '', email: '', address: '',
    currency: 'USD', taxRate: 0, quotePrefix: 'QP-', quoteValidityDays: 14, terms: ''
  });
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (userProfile) setDisplayName(userProfile.displayName || '');
    if (business) {
      setForm({
        name: business.name || '',
        industry: business.industry || 'Residential Cleaning',
        phone: business.phone || '',
        email: business.email || '',
        address: business.address || '',
        currency: business.currency || 'USD',
        taxRate: business.taxRate ?? 0,
        quotePrefix: business.quotePrefix || 'QP-',
        quoteValidityDays: business.quoteValidityDays || 14,
        terms: business.terms || ''
      });
      setServices(business.services || []);
    }
  }, [business, userProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim() });
      await updateBusinessProfile(business.id, {
        ...form,
        taxRate: Number(form.taxRate || 0),
        quoteValidityDays: Number(form.quoteValidityDays || 14),
        services: services.filter((s) => s.name.trim())
      });
      setSavedMsg('Business & profile settings saved to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business & Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your company identity, tax defaults, quotation terms, and service price list.</p>
      </div>

      {savedMsg && <AlertBanner type="success" message={savedMsg} onClose={() => setSavedMsg('')} />}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">User Profile & Business Identity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Your Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Email</label>
              <input disabled value={user?.email || ''} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Business Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Industry</label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Business Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Business Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Address / Service Area</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Quotation Defaults</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <input type="number" step="0.1" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quote Prefix</label>
              <input value={form.quotePrefix} onChange={(e) => setForm({ ...form, quotePrefix: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Validity (Days)</label>
              <input type="number" value={form.quoteValidityDays} onChange={(e) => setForm({ ...form, quoteValidityDays: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Default Terms & Conditions</label>
            <textarea rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Configured Service Catalog</h2>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setServices((p) => [...p, { id: 'srv_' + Date.now(), name: '', unit: 'Flat Rate', price: 0 }])}
            >
              <Plus className="w-3.5 h-3.5" /> Add Service
            </Button>
          </div>
          <div className="space-y-2.5">
            {services.map((srv, idx) => (
              <div key={srv.id} className="grid sm:grid-cols-12 gap-2 items-center">
                <input
                  className="sm:col-span-5 px-2.5 py-1.5 rounded border border-slate-300 text-sm"
                  placeholder="Service name"
                  value={srv.name}
                  onChange={(e) => setServices((p) => p.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s)))}
                />
                <input
                  className="sm:col-span-3 px-2.5 py-1.5 rounded border border-slate-300 text-sm"
                  placeholder="Unit"
                  value={srv.unit}
                  onChange={(e) => setServices((p) => p.map((s, i) => (i === idx ? { ...s, unit: e.target.value } : s)))}
                />
                <input
                  type="number"
                  min="0"
                  className="sm:col-span-3 px-2.5 py-1.5 rounded border border-slate-300 text-sm"
                  value={srv.price}
                  onChange={(e) => setServices((p) => p.map((s, i) => (i === idx ? { ...s, price: Number(e.target.value) } : s)))}
                />
                <button
                  type="button"
                  onClick={() => setServices((p) => p.filter((_, i) => i !== idx))}
                  className="sm:col-span-1 text-slate-400 hover:text-rose-600 justify-self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving}>Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
