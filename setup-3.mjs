import fs from 'node:fs';
import path from 'node:path';

const files = {};

files['src/pages/CustomersPage.jsx'] = `import React, { useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addInteraction, upsertCustomer } from '../services/firestoreService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Badge, Button, Card, EmptyState, Modal } from '../components/UI';

export default function CustomersPage() {
  const { business, customers, leads, quotations, interactions, userProfile } = useAuth();
  const currency = business?.currency || 'USD';

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', propertySize: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const activeCustomer = customers.find((c) => c.id === selectedId) || filtered[0] || null;
  const customerLeads = activeCustomer ? leads.filter((l) => l.customerId === activeCustomer.id) : [];
  const customerQuotes = activeCustomer ? quotations.filter((q) => q.customerId === activeCustomer.id) : [];
  const customerTimeline = activeCustomer ? interactions.filter((i) => i.customerId === activeCustomer.id) : [];
  const wonTotal = customerQuotes
    .filter((q) => q.status === 'Accepted')
    .reduce((sum, q) => sum + Number(q.total || 0), 0);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const id = await upsertCustomer(business.id, form);
    setSelectedId(id);
    setShowAdd(false);
    setForm({ name: '', email: '', phone: '', address: '', propertySize: '' });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!activeCustomer || !noteText.trim()) return;
    await addInteraction(business.id, {
      customerId: activeCustomer.id,
      type: 'Note',
      title: 'Team Note Added',
      details: noteText.trim(),
      createdBy: userProfile?.displayName || 'User'
    });
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers & History</h1>
          <p className="text-sm text-slate-500 mt-1">Unified client profiles with inquiry, quotation, and follow-up timelines.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers recorded yet"
          description="Customers are automatically created when you capture a lead, or you can add one manually."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Customer</Button>}
        />
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <Card className="lg:col-span-5 p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {filtered.map((c) => {
                const isSelected = activeCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={'w-full text-left p-3 rounded-lg transition-colors ' + (isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50')}
                  >
                    <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email || c.phone || 'No contact info'}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {activeCustomer && (
            <div className="lg:col-span-7 space-y-5">
              <Card className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{activeCustomer.name}</h2>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {activeCustomer.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {activeCustomer.email}</p>}
                      {activeCustomer.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {activeCustomer.phone}</p>}
                      {activeCustomer.address && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {activeCustomer.address}</p>}
                      {activeCustomer.propertySize && <p>Property: {activeCustomer.propertySize}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Accepted Revenue</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(wonTotal, currency)}</p>
                    <p className="text-xs text-slate-500 mt-1">{customerLeads.length} leads • {customerQuotes.length} quotes</p>
                  </div>
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-3 border-t border-slate-100">
                  <input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Log a call note or preference (e.g. prefers eco-friendly supplies)..."
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300"
                  />
                  <Button type="submit" size="sm">Log Note</Button>
                </form>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Interaction Timeline</h3>
                {customerTimeline.length === 0 ? (
                  <p className="text-xs text-slate-500">No interactions recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {customerTimeline.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-white text-slate-700 border-slate-300">{item.type}</Badge>
                            <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                          </div>
                          <span className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</span>
                        </div>
                        {item.details && <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{item.details}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer">
        <form onSubmit={handleAddCustomer} className="space-y-3">
          <input required placeholder="Customer Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <input placeholder="Property Size (e.g. 2 bed / 1 bath)" value={form.propertySize} onChange={(e) => setForm({ ...form, propertySize: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
`;

files['src/pages/AnalyticsPage.jsx'] = `import React, { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, LEAD_STAGES } from '../utils/formatters';
import { Card, EmptyState, StatCard } from '../components/UI';

const COLORS = ['#2563eb', '#4f46e5', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

export default function AnalyticsPage() {
  const { business, leads, quotations, followups } = useAuth();
  const currency = business?.currency || 'USD';

  const stageData = useMemo(() => {
    return LEAD_STAGES.map((s) => ({
      stage: s.label,
      count: leads.filter((l) => l.stage === s.id).length
    }));
  }, [leads]);

  const sourceData = useMemo(() => {
    const counts = {};
    leads.forEach((l) => {
      const src = l.source || 'Unspecified';
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const quoteSummary = useMemo(() => {
    const statuses = ['Draft', 'Sent', 'Accepted', 'Declined'];
    return statuses.map((st) => ({
      status: st,
      amount: quotations
        .filter((q) => (q.status || 'Draft') === st)
        .reduce((sum, q) => sum + Number(q.total || 0), 0)
    }));
  }, [quotations]);

  const acceptedRevenue = quotations
    .filter((q) => q.status === 'Accepted')
    .reduce((sum, q) => sum + Number(q.total || 0), 0);

  const avgQuoteValue = quotations.length > 0
    ? quotations.reduce((sum, q) => sum + Number(q.total || 0), 0) / quotations.length
    : 0;

  const wonCount = leads.filter((l) => l.stage === 'Won').length;
  const closedCount = leads.filter((l) => l.stage === 'Won' || l.stage === 'Lost').length;
  const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
  const completedFollowups = followups.filter((f) => f.status === 'Completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          All figures and charts below are computed live from your saved Firestore records.
        </p>
      </div>

      {leads.length === 0 && quotations.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          description="Save real leads and quotations first. QuotePilot AI never displays fabricated sample statistics."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Accepted Revenue" value={formatCurrency(acceptedRevenue, currency)} accent="emerald" />
            <StatCard label="Average Quote Value" value={formatCurrency(avgQuoteValue, currency)} accent="blue" />
            <StatCard label="Close Win Rate" value={conversionRate + '%'} hint={wonCount + ' won / ' + closedCount + ' closed'} accent="indigo" />
            <StatCard label="Follow-ups Completed" value={completedFollowups + ' / ' + followups.length} accent="amber" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Lead Pipeline Funnel</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Quotation Value by Status ({currency})</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quoteSummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Inquiries by Lead Source</h2>
              {sourceData.length === 0 ? (
                <p className="text-sm text-slate-500">No lead source data available yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                        {sourceData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
`;

files['src/pages/LostDealsPage.jsx'] = `import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sparkles, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeLostDealsWithAI } from '../services/aiService';
import { incrementUsage } from '../services/firestoreService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, EmptyState } from '../components/UI';

export default function LostDealsPage() {
  const { business, leads, selectedAiModel } = useAuth();
  const currency = business?.currency || 'USD';
  const [insights, setInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState('');

  const lostDeals = useMemo(() => leads.filter((l) => l.stage === 'Lost'), [leads]);
  const totalLostValue = lostDeals.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

  const reasonData = useMemo(() => {
    const counts = {};
    lostDeals.forEach((d) => {
      const reason = d.lostReason || 'Unspecified';
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).map(([reason, count]) => ({ reason, count }));
  }, [lostDeals]);

  const handleGenerateInsights = async () => {
    setError('');
    setLoadingAi(true);
    try {
      const res = await analyzeLostDealsWithAI({
        businessName: business.name,
        lostDeals,
        currency,
        model: selectedAiModel
      });
      setInsights(res.insights);
      await incrementUsage(business.id, business, 'ai');
    } catch (err) {
      setError(err.message || 'Could not generate AI lost-deal insights.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lost Deals & Win-Back Insights</h1>
          <p className="text-sm text-slate-500 mt-1">Understand why opportunities were lost and uncover pricing or response gaps.</p>
        </div>
        {lostDeals.length > 0 && (
          <Button onClick={handleGenerateInsights} loading={loadingAi}>
            <Sparkles className="w-4 h-4" /> Analyze Lost Patterns with AI
          </Button>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

      {lostDeals.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="No lost deals recorded"
          description="When a lead is moved to Lost or a quotation is declined, the reason and value appear here automatically."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Lost Opportunities</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{lostDeals.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Estimated Lost Revenue</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalLostValue, currency)}</p>
            </Card>
          </div>

          {insights && (
            <Card className="p-5 bg-blue-50/40 border-blue-200 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> Gemini Insights on Your Lost Deals
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-800 mb-1">Observed Patterns</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
                    {(insights.topPatterns || []).map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">Process Improvements</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
                    {(insights.processImprovements || []).map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              </div>
              {insights.pricingAdvice && (
                <p className="text-xs text-slate-700 pt-2 border-t border-blue-200/70">
                  <strong>Pricing Guidance:</strong> {insights.pricingAdvice}
                </p>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Lost Reasons Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Est. Value</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lostDeals.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{d.customerName}</td>
                    <td className="px-4 py-3"><Badge className="bg-rose-50 text-rose-700 border-rose-200">{d.lostReason || 'Unspecified'}</Badge></td>
                    <td className="px-4 py-3">{formatCurrency(d.estimatedValue, currency)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{d.lostNotes || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.updatedAt || d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
`;

files['src/pages/TeamPage.jsx'] = `import React, { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addTeamMember, deleteTeamMember } from '../services/firestoreService';
import { AlertBanner, Badge, Button, Card, Modal } from '../components/UI';

export default function TeamPage() {
  const { business, team, leads, planLimits } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Sales Rep');
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (team.length >= planLimits.maxTeamMembers) {
      setError('Team limit reached (' + planLimits.maxTeamMembers + ' members on ' + planLimits.name + '). Upgrade your plan to add more.');
      return;
    }
    await addTeamMember(business.id, { name: name.trim(), email: email.trim(), role });
    setShowAdd(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team & Lead Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage team seats ({team.length}/{planLimits.maxTeamMembers} used) and track assigned inquiries.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Leads</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team.map((m) => {
              const assignedCount = leads.filter((l) => l.assignedToUid === (m.uid || m.id)).length;
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{m.role}</td>
                  <td className="px-4 py-3">
                    <Badge className={m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                      {m.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{assignedCount}</td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'Owner' && (
                      <button
                        onClick={() => deleteTeamMember(business.id, m.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Team Member">
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jordan@company.com" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option>Sales Rep</option>
              <option>Estimator</option>
              <option>Operations Manager</option>
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Note: Added members appear immediately in Lead Assignment dropdowns.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit"><UserPlus className="w-4 h-4" /> Add Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
`;

files['src/pages/IntegrationsPage.jsx'] = `import React, { useEffect, useState } from 'react';
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
`;

files['src/pages/SubscriptionPage.jsx'] = `import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateBusinessProfile } from '../services/firestoreService';
import { PLAN_LIMITS } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card } from '../components/UI';

export default function SubscriptionPage() {
  const { business, aiCallsUsed, quotesUsed, team, planLimits } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');
  const currentPlan = business?.plan || 'starter';

  const handleSwitchPlan = async (planKey) => {
    setUpdating(true);
    setMsg('');
    try {
      await updateBusinessProfile(business.id, { plan: planKey });
      setMsg('Workspace tier updated to ' + PLAN_LIMITS[planKey].name + ' (Sandbox mode — no real payment was charged).');
    } finally {
      setUpdating(false);
    }
  };

  const aiPct = Math.min(100, Math.round((aiCallsUsed / planLimits.aiCallsPerMonth) * 100));
  const quotePct = Math.min(100, Math.round((quotesUsed / planLimits.quotesPerMonth) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription & Usage Limits</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor monthly AI & quotation allowances enforced in your workspace.</p>
      </div>

      <AlertBanner
        type="info"
        title="Billing Integration Status: Awaiting Stripe Credentials"
        message="Quota tracking and plan enforcement are active in Firestore. Real card checkout requires setting STRIPE_SECRET_KEY and webhook handlers on the backend."
      />

      {msg && <AlertBanner type="success" message={msg} onClose={() => setMsg('')} />}

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
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: Math.min(100, Math.round((team.length / planLimits.maxTeamMembers) * 100)) + '%' }} />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {Object.entries(PLAN_LIMITS).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          return (
            <Card key={key} className={'p-6 flex flex-col justify-between ' + (isCurrent ? 'border-blue-600 ring-1 ring-blue-600' : '')}>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                  {isCurrent && <Badge className="bg-blue-50 text-blue-700 border-blue-200">Current</Badge>}
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{plan.priceLabel}</p>
                <p className="text-xs text-slate-500 mt-2">{plan.description}</p>
                <ul className="mt-5 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {plan.aiCallsPerMonth} AI analyses / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {plan.quotesPerMonth} quotations / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Up to {plan.maxTeamMembers} team seats</li>
                </ul>
              </div>
              <Button
                className="mt-6 w-full"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent}
                loading={updating}
                onClick={() => handleSwitchPlan(key)}
              >
                {isCurrent ? 'Active Plan' : 'Select ' + plan.name + ' (Sandbox)'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
`;

files['src/pages/SettingsPage.jsx'] = `import React, { useEffect, useState } from 'react';
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
`;

files['src/App.jsx'] = `import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import AiIntelligencePage from './pages/AiIntelligencePage';
import QuotationsPage from './pages/QuotationsPage';
import CustomersPage from './pages/CustomersPage';
import FollowUpsPage from './pages/FollowUpsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LostDealsPage from './pages/LostDealsPage';
import TeamPage from './pages/TeamPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireBusiness={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="ai-intelligence" element={<AiIntelligencePage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="follow-ups" element={<FollowUpsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="lost-deals" element={<LostDealsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;

files['README.md'] = `# QuotePilot AI — Turn Every Inquiry Into an Opportunity

Academic Project for **FoCP (CSE-1003)**
Team Members:
- Prakhar Srivastava — Scholar No. 26U020115
- Prakhar Srivastava — Scholar No. 26U020165
- Shreyash Seth — Scholar No. 26U020157

## 1. Install Dependencies
\`\`\`bash
npm run setup
\`\`\`

## 2. Configure Environment Variables
1. Copy \`.env.example\` to \`.env\` and add your Firebase Web App credentials (Authentication + Firestore enabled in Firebase Console).
2. Copy \`server/.env.example\` to \`server/.env\` and add:
   - \`GEMINI_API_KEY\` from Google AI Studio (https://aistudio.google.com/apikey)
   - \`FIREBASE_WEB_API_KEY\` (same Firebase Web API key, used server-side to verify caller ID tokens)

## 3. Run Locally
\`\`\`bash
npm run dev
\`\`\`
- Frontend runs at http://localhost:5173
- Backend Gemini API server runs at http://localhost:3001

## 4. Deploy to Firebase Hosting & Firestore
1. Install Firebase CLI: \`npm install -g firebase-tools\`
2. Login and link project:
   - \`firebase login\`
   - Copy \`.firebaserc.example\` to \`.firebaserc\` and set your Firebase Project ID.
3. Deploy Firestore rules & React app:
   \`\`\`bash
   npm run build
   firebase deploy --only firestore:rules,hosting
   \`\`\`
4. Deploy \`server/index.js\` to a free Node host (e.g. Render/Railway) and set \`VITE_API_BASE_URL\` in \`.env\` before running \`npm run build\`, OR upgrade Firebase to the **Blaze** plan if you want to run backend logic inside Cloud Functions v2.

## 5. Free-Tier Limits & Billing Notes
- **Firebase Spark (Free)**: Includes Firebase Auth, 1 GiB Firestore storage / 50k reads + 20k writes per day, and Firebase Hosting. Cloud Functions v2 requires upgrading to the pay-as-you-go Blaze plan, which is why the Express backend in \`server/index.js\` is provided separately.
- **Google Gemini API Free Tier**: Subject to Google AI Studio RPM/RPD rate limits and prompt logging terms on free tier.
- **Email / WhatsApp / Stripe**: Integration status checks and UI are built; actual delivery/billing requires SMTP, Meta WhatsApp Cloud API, and Stripe credentials in \`server/.env\`.
`;

let count = 0;
for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.resolve(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  count++;
  console.log('Created:', relPath);
}
console.log('\\nPart 3 complete! Created ' + count + ' files.');
console.log('All files are ready! Now run: npm run setup');