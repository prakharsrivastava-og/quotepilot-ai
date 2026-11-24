import React, { useState } from 'react';
import { CheckCircle2, Clock, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateFollowUpDraft } from '../services/aiService';
import { addInteraction, createFollowUp, incrementUsage, updateFollowUp } from '../services/firestoreService';
import { formatDate } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, EmptyState, Modal } from '../components/UI';

export default function FollowUpsPage() {
  const { business, leads, quotations, followups, userProfile, selectedAiModel } = useAuth();
  const [filter, setFilter] = useState('Pending');
  const [showAdd, setShowAdd] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [channel, setChannel] = useState('Email');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const filtered = followups.filter((f) => filter === 'All' || f.status === filter);

  const handleGenerateDraft = async () => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) {
      setError('Select a lead first to generate an AI follow-up draft.');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const quote = quotations.find((q) => q.leadId === lead.id);
      const res = await generateFollowUpDraft({
        businessName: business.name,
        customerName: lead.customerName,
        serviceRequested: lead.serviceRequested,
        quoteTotal: quote?.total || lead.estimatedValue || '',
        currency: business.currency,
        channel,
        note,
        model: selectedAiModel
      });
      const text = (res.draft?.subject ? 'Subject: ' + res.draft.subject + '\n\n' : '') + (res.draft?.message || '');
      setAiDraft(text);
      await incrementUsage(business.id, business, 'ai');
    } catch (err) {
      setError(err.message || 'Could not generate follow-up draft.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === leadId);
    await createFollowUp(business.id, {
      leadId: lead?.id || '',
      customerId: lead?.customerId || '',
      leadName: lead?.customerName || 'General Follow-up',
      customerEmail: lead?.customerEmail || '',
      customerPhone: lead?.customerPhone || '',
      channel,
      dueDate,
      note,
      aiDraft
    });
    setShowAdd(false);
    setNote('');
    setAiDraft('');
  };

  const toggleComplete = async (f) => {
    const nextStatus = f.status === 'Completed' ? 'Pending' : 'Completed';
    await updateFollowUp(business.id, f.id, { status: nextStatus });
    if (nextStatus === 'Completed' && f.customerId) {
      await addInteraction(business.id, {
        customerId: f.customerId,
        leadId: f.leadId || '',
        type: 'Follow-up',
        title: f.channel + ' Follow-up Completed',
        details: f.note || f.aiDraft || '',
        createdBy: userProfile?.displayName || 'User'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-up Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">Never drop a warm inquiry. Schedule reminders and generate AI follow-up messages.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Schedule Follow-up
        </Button>
      </div>

      <div className="flex gap-2">
        {['Pending', 'Completed', 'All'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={'px-3.5 py-1.5 rounded-lg text-xs font-medium border ' + (filter === tab ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200')}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={'No ' + filter.toLowerCase() + ' follow-ups'}
          description="Schedule follow-ups after sending replies or quotations to maximize close rates."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Follow-up</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <Card key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900 text-sm">{f.leadName}</p>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">{f.channel}</Badge>
                  <Badge className={f.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                    {f.status} • Due {formatDate(f.dueDate)}
                  </Badge>
                </div>
                {f.note && <p className="text-xs text-slate-600">{f.note}</p>}
                {f.aiDraft && (
                  <pre className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-sans">
                    {f.aiDraft}
                  </pre>
                )}
              </div>
              <Button
                size="sm"
                variant={f.status === 'Completed' ? 'secondary' : 'primary'}
                onClick={() => toggleComplete(f)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {f.status === 'Completed' ? 'Reopen' : 'Mark Completed'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Schedule Follow-up">
        {error && <div className="mb-3"><AlertBanner type="error" message={error} /></div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lead / Customer</label>
            <select
              required
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">Select a lead...</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.customerName} ({l.stage})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option>Email</option>
                <option>WhatsApp</option>
                <option>Phone Call</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reminder Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Check if they reviewed quotation & confirm Friday slot"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Message Draft</label>
              <Button type="button" size="sm" variant="secondary" loading={generating} onClick={handleGenerateDraft}>
                <Sparkles className="w-3.5 h-3.5" /> Generate with AI
              </Button>
            </div>
            <textarea
              rows={4}
              value={aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              placeholder="Click 'Generate with AI' or write your own follow-up draft..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Save Follow-up</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
