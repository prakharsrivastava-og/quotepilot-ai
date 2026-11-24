import React, { useMemo, useState } from 'react';
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
