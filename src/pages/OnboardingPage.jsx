import React, { useEffect, useState } from 'react';
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
