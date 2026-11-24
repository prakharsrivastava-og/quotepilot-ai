import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Check, CheckCircle2, Clock, Copy, FileText, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyzeInquiryWithAI } from '../services/aiService';
import {
  addInteraction, createFollowUp, createLead, incrementUsage, updateLead
} from '../services/firestoreService';
import { AlertBanner, Badge, Button, Card } from '../components/UI';

export default function AiIntelligencePage() {
  const {
    business, leads, userProfile, selectedAiModel, aiCallsUsed, planLimits
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedLeadId, setSelectedLeadId] = useState(searchParams.get('leadId') || '');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [propertySize, setPropertySize] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [rawInquiry, setRawInquiry] = useState('');
  const [tone, setTone] = useState('Professional & Warm');

  const [analysis, setAnalysis] = useState(null);
  const [editableReply, setEditableReply] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const paramId = searchParams.get('leadId');
    if (paramId) setSelectedLeadId(paramId);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedLeadId) return;
    const found = leads.find((l) => l.id === selectedLeadId);
    if (found) {
      setCustomerName(found.customerName || '');
      setCustomerEmail(found.customerEmail || '');
      setPropertySize(found.propertySize || '');
      setDesiredDate(found.desiredDate || '');
      setRawInquiry(found.rawInquiry || '');
      if (found.aiAnalysis) {
        setAnalysis(found.aiAnalysis);
        setEditableReply(found.aiAnalysis.suggestedReply || '');
      } else {
        setAnalysis(null);
        setEditableReply('');
      }
    }
  }, [selectedLeadId, leads]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');

    if (aiCallsUsed >= planLimits.aiCallsPerMonth) {
      setError('Monthly AI quota reached for your current plan. Upgrade in Subscription to continue.');
      return;
    }
    if (!rawInquiry.trim() || rawInquiry.trim().length < 5) {
      setError('Please enter a customer inquiry before running AI analysis.');
      return;
    }

    setAnalyzing(true);
    try {
      let targetLeadId = selectedLeadId;
      let targetCustomerId = leads.find((l) => l.id === selectedLeadId)?.customerId || '';

      if (!targetLeadId) {
        const created = await createLead(
          business.id,
          {
            customerName: customerName.trim() || 'Prospective Client',
            customerEmail: customerEmail.trim(),
            propertySize: propertySize.trim(),
            desiredDate,
            rawInquiry: rawInquiry.trim(),
            source: 'AI Workspace'
          },
          userProfile?.displayName || 'User'
        );
        targetLeadId = created.leadId;
        targetCustomerId = created.customerId;
        setSelectedLeadId(targetLeadId);
      }

      const res = await analyzeInquiryWithAI({
        businessName: business.name,
        industry: business.industry,
        currency: business.currency,
        services: business.services || [],
        customerName: customerName.trim() || 'Prospective Client',
        rawInquiry: rawInquiry.trim(),
        propertySize: propertySize.trim(),
        desiredDate,
        tone,
        model: selectedAiModel
      });

      const aiData = res.analysis;
      setAnalysis(aiData);
      setEditableReply(aiData.suggestedReply || '');

      const estimatedFromCatalog = (aiData.recommendedServices || []).reduce((sum, rec) => {
        const srv = (business.services || []).find(
          (s) => s.id === rec.matchedCatalogId || s.name.toLowerCase() === (rec.serviceName || '').toLowerCase()
        );
        return sum + (srv ? Number(srv.price) * Number(rec.suggestedQty || 1) : 0);
      }, 0);

      await updateLead(business.id, targetLeadId, {
        stage: aiData.score >= 65 ? 'Qualified' : 'AI Analyzed',
        aiAnalysis: aiData,
        estimatedValue: estimatedFromCatalog
      });

      await incrementUsage(business.id, business, 'ai');

      if (targetCustomerId) {
        await addInteraction(business.id, {
          customerId: targetCustomerId,
          leadId: targetLeadId,
          type: 'AI Analysis',
          title: 'Gemini Qualified Lead: ' + aiData.tier + ' (' + aiData.score + '/100)',
          details: aiData.summary,
          createdBy: 'QuotePilot AI (' + res.modelUsed + ')'
        });
      }

      setStatusMsg('Inquiry analyzed with ' + res.modelUsed + ' and saved to Firestore.');
    } catch (err) {
      setError(err.message || 'AI analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveReplyDraft = async () => {
    if (!selectedLeadId || !analysis) return;
    const updated = { ...analysis, suggestedReply: editableReply };
    await updateLead(business.id, selectedLeadId, { aiAnalysis: updated });
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (lead?.customerId) {
      await addInteraction(business.id, {
        customerId: lead.customerId,
        leadId: selectedLeadId,
        type: 'Reply Draft',
        title: 'Customer Reply Saved',
        details: editableReply,
        createdBy: userProfile?.displayName || 'User'
      });
    }
    setStatusMsg('Edited customer reply saved to lead & customer history.');
  };

  const handleScheduleFollowup = async () => {
    if (!selectedLeadId) return;
    const lead = leads.find((l) => l.id === selectedLeadId);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await createFollowUp(business.id, {
      leadId: selectedLeadId,
      customerId: lead?.customerId || '',
      leadName: lead?.customerName || customerName,
      customerEmail: lead?.customerEmail || customerEmail,
      channel: 'Email',
      dueDate: tomorrow,
      note: 'Follow up on inquiry & missing details',
      aiDraft: editableReply
    });
    setStatusMsg('Follow-up reminder scheduled for tomorrow.');
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(editableReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Server-Side Gemini Engine ({selectedAiModel})
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">AI Sales Intelligence</h1>
          <p className="text-sm text-slate-500">
            Analyze any inquiry, detect objections & missing details, draft replies, and launch a priced quotation.
          </p>
        </div>
        {selectedLeadId && analysis && (
          <Button onClick={() => navigate('/app/quotations?leadId=' + selectedLeadId)}>
            <FileText className="w-4 h-4" /> Convert to Quotation
          </Button>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {statusMsg && <AlertBanner type="success" message={statusMsg} onClose={() => setStatusMsg('')} />}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-5 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Load Existing Lead (or enter new below)</label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedLeadId(val);
                if (!val) {
                  setCustomerName(''); setCustomerEmail(''); setPropertySize('');
                  setDesiredDate(''); setRawInquiry(''); setAnalysis(null); setEditableReply('');
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">+ Create & Analyze New Inquiry</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.customerName} — {l.stage}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Property / Scope</label>
                <input
                  value={propertySize}
                  onChange={(e) => setPropertySize(e.target.value)}
                  placeholder="3 bed, 2 bath"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reply Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option>Professional & Warm</option>
                  <option>Concise & Direct</option>
                  <option>Consultative & Detailed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Inquiry Message *</label>
              <textarea
                required
                rows={6}
                value={rawInquiry}
                onChange={(e) => setRawInquiry(e.target.value)}
                placeholder="Example: Hi! Moving out of my 3BR apartment next Friday and need a deep clean including oven and interior windows. Can you share pricing? Another company quoted $220."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <Button type="submit" loading={analyzing} className="w-full">
              <Sparkles className="w-4 h-4" />
              {analyzing ? 'Analyzing with Gemini...' : 'Run AI Sales Analysis'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-7 space-y-5">
          {!analysis ? (
            <Card className="p-10 text-center border-dashed">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Ready for AI Qualification</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Select an existing lead or paste an inquiry on the left. Gemini will return structured qualification,
                missing information, objection handling, and an editable customer response.
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Qualification Score</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-slate-900">{analysis.score}</span>
                      <span className="text-sm text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={
                      analysis.tier === 'Hot'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : analysis.tier === 'Warm'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }>
                      Tier: {analysis.tier}
                    </Badge>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      Urgency: {analysis.urgency}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p><strong>Summary:</strong> {analysis.summary}</p>
                  <p><strong>Estimated Scope:</strong> {analysis.estimatedScope}</p>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Information
                  </h3>
                  {(analysis.missingInfo || []).length === 0 ? (
                    <p className="text-xs text-slate-500">All essential details provided.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {analysis.missingInfo.map((m, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Recommended Catalog Items
                  </h3>
                  {(analysis.recommendedServices || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No specific catalog items matched.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-slate-700">
                      {analysis.recommendedServices.map((rec, i) => (
                        <li key={i} className="p-2 rounded bg-slate-50 border border-slate-200/70">
                          <p className="font-semibold text-slate-900">{rec.serviceName} × {rec.suggestedQty || 1}</p>
                          <p className="text-slate-500 mt-0.5">{rec.reason}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              {(analysis.objections || []).length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Detected Objections & Handling Tips</h3>
                  <div className="space-y-2.5">
                    {analysis.objections.map((obj, i) => (
                      <div key={i} className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/70 text-xs">
                        <p className="font-semibold text-rose-900">Objection: {obj.objection}</p>
                        <p className="text-slate-700 mt-1"><strong>Suggested Response:</strong> {obj.responseTip}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Editable Customer Reply</h3>
                  <Button size="sm" variant="secondary" onClick={handleCopyReply}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Reply'}
                  </Button>
                </div>
                <textarea
                  rows={6}
                  value={editableReply}
                  onChange={(e) => setEditableReply(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <div className="flex flex-wrap justify-between gap-2 pt-1">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={handleSaveReplyDraft}>
                      Save Reply to History
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleScheduleFollowup}>
                      <Clock className="w-3.5 h-3.5" /> Schedule Follow-up
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => navigate('/app/quotations?leadId=' + selectedLeadId)}>
                    <FileText className="w-3.5 h-3.5" /> Build Quotation
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
