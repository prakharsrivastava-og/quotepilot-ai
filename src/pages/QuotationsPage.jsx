import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createQuotation, updateLead, updateQuotation } from '../services/firestoreService';
import { exportQuotationPdf } from '../utils/pdfExport';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, EmptyState, Modal } from '../components/UI';

const STATUS_BADGE = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Sent: 'bg-blue-50 text-blue-700 border-blue-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Declined: 'bg-rose-50 text-rose-700 border-rose-200'
};

export default function QuotationsPage() {
  const { business, leads, quotations, userProfile, quotesUsed, planLimits } = useAuth();
  const [searchParams] = useSearchParams();
  const currency = business?.currency || 'USD';

  const [showBuilder, setShowBuilder] = useState(false);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [leadId, setLeadId] = useState(searchParams.get('leadId') || '');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [title, setTitle] = useState('Cleaning Service Quotation');
  const [items, setItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(business?.taxRate || 0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(business?.terms || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const paramLeadId = searchParams.get('leadId');
    if (paramLeadId) {
      setLeadId(paramLeadId);
      setShowBuilder(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setCustomerName(lead.customerName || '');
    setCustomerEmail(lead.customerEmail || '');
    setCustomerPhone(lead.customerPhone || '');
    setCustomerAddress(lead.address || '');
    setTitle(lead.serviceRequested || 'Service Quotation');

    const recs = lead.aiAnalysis?.recommendedServices || [];
    if (recs.length > 0 && (business?.services || []).length > 0) {
      const mapped = recs.map((rec) => {
        const srv = business.services.find(
          (s) => s.id === rec.matchedCatalogId || s.name.toLowerCase() === (rec.serviceName || '').toLowerCase()
        );
        const qty = Number(rec.suggestedQty || 1);
        const unitPrice = srv ? Number(srv.price) : 0;
        return {
          description: srv ? srv.name : rec.serviceName,
          unit: srv ? srv.unit : 'Flat Rate',
          qty,
          unitPrice,
          total: qty * unitPrice
        };
      });
      setItems(mapped);
    } else if (items.length === 0 && (business?.services || []).length > 0) {
      const first = business.services[0];
      setItems([{ description: first.name, unit: first.unit, qty: 1, unitPrice: first.price, total: first.price }]);
    }
  }, [leadId, leads, business]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0), 0),
    [items]
  );
  const discounted = Math.max(0, subtotal - Number(discountAmount || 0));
  const taxAmount = (discounted * Number(taxRate || 0)) / 100;
  const total = discounted + taxAmount;

  const addCatalogItem = (srvId) => {
    const srv = (business?.services || []).find((s) => s.id === srvId);
    if (!srv) return;
    setItems((prev) => [
      ...prev,
      { description: srv.name, unit: srv.unit, qty: 1, unitPrice: Number(srv.price), total: Number(srv.price) }
    ]);
  };

  const updateItem = (idx, field, val) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [field]: field === 'qty' || field === 'unitPrice' ? Number(val) : val };
        next.total = Number(next.qty || 0) * Number(next.unitPrice || 0);
        return next;
      })
    );
  };

  const handleSaveQuote = async (e) => {
    e.preventDefault();
    setError('');
    if (quotesUsed >= planLimits.quotesPerMonth) {
      setError('Monthly quotation limit reached for your current plan.');
      return;
    }
    if (!customerName.trim() || items.length === 0) {
      setError('Customer name and at least one line item are required.');
      return;
    }
    setSaving(true);
    try {
      const linkedLead = leads.find((l) => l.id === leadId);
      const quoteNumber = (business?.quotePrefix || 'QP-') + String(quotations.length + 101);
      const issueDate = new Date().toISOString().slice(0, 10);
      const validDays = Number(business?.quoteValidityDays || 14);
      const validUntil = new Date(Date.now() + validDays * 86400000).toISOString().slice(0, 10);

      await createQuotation(
        business.id,
        {
          quoteNumber,
          leadId: leadId || '',
          customerId: linkedLead?.customerId || '',
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          title: title.trim(),
          issueDate,
          validUntil,
          items,
          subtotal,
          discountAmount: Number(discountAmount || 0),
          taxRate: Number(taxRate || 0),
          taxAmount,
          total,
          notes,
          terms,
          status: 'Draft',
          createdBy: userProfile?.displayName || 'User'
        },
        business
      );

      if (leadId) {
        await updateLead(business.id, leadId, { estimatedValue: total });
      }
      setShowBuilder(false);
    } catch (err) {
      setError(err.message || 'Failed to save quotation.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (quote, nextStatus) => {
    await updateQuotation(business.id, quote.id, { status: nextStatus });
    if (quote.leadId) {
      if (nextStatus === 'Sent') await updateLead(business.id, quote.leadId, { stage: 'Quote Sent', estimatedValue: quote.total });
      if (nextStatus === 'Accepted') await updateLead(business.id, quote.leadId, { stage: 'Won', estimatedValue: quote.total });
      if (nextStatus === 'Declined') await updateLead(business.id, quote.leadId, { stage: 'Lost', lostReason: 'Quote Declined' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate itemized quotations from your configured pricing catalog and export professional PDFs.
          </p>
        </div>
        <Button onClick={() => {
          if (items.length === 0 && (business?.services || []).length > 0) {
            const first = business.services[0];
            setItems([{ description: first.name, unit: first.unit, qty: 1, unitPrice: Number(first.price), total: Number(first.price) }]);
          }
          setShowBuilder(true);
        }}>
          <Plus className="w-4 h-4" /> New Quotation
        </Button>
      </div>

      {quotations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations created yet"
          description="Create your first quotation from a lead or directly from your service price catalog."
          action={<Button onClick={() => setShowBuilder(true)}><Plus className="w-4 h-4" /> Create Quotation</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Quote #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{q.quoteNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{q.customerName}</div>
                      <div className="text-xs text-slate-500">{q.title}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(q.issueDate)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(q.total, currency)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={q.status || 'Draft'}
                        onChange={(e) => handleStatusChange(q, e.target.value)}
                        className="px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => setPreviewQuote(q)}>
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Button>
                      <Button size="sm" onClick={() => exportQuotationPdf(q, business)}>
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showBuilder} onClose={() => setShowBuilder(false)} title="Create Quotation" maxWidth="max-w-3xl">
        {error && <div className="mb-3"><AlertBanner type="error" message={error} /></div>}
        <form onSubmit={handleSaveQuote} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Link Lead (Optional)</label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">Standalone Quotation</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.customerName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Quotation Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Name *</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Line Items</h3>
              <div className="flex gap-2">
                <select
                  onChange={(e) => { if (e.target.value) { addCatalogItem(e.target.value); e.target.value = ''; } }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">+ Add from Price Catalog</option>
                  {(business?.services || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price, currency)})</option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setItems((p) => [...p, { description: '', unit: 'Flat Rate', qty: 1, unitPrice: 0, total: 0 }])}
                >
                  + Custom Row
                </Button>
              </div>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-5 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  placeholder="Service description"
                  value={it.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
                <input
                  className="col-span-2 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  placeholder="Unit"
                  value={it.unit}
                  onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  className="col-span-2 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  value={it.qty}
                  onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="col-span-2 px-2.5 py-1.5 text-sm rounded border border-slate-300"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  className="col-span-1 text-slate-400 hover:text-rose-600 justify-self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Discount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm bg-white"
                />
              </div>
            </div>
            <div className="text-sm space-y-1.5 self-center">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Discount</span><span>- {formatCurrency(discountAmount, currency)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmount, currency)}</span></div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Total</span><span>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Terms & Conditions</label>
              <textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowBuilder(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Quotation</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(previewQuote)} onClose={() => setPreviewQuote(null)} title="Quotation Document Preview" maxWidth="max-w-3xl">
        {previewQuote && (
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-navy-900 text-white p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{business?.name}</h2>
                  <p className="text-xs text-slate-300 mt-1">{[business?.email, business?.phone, business?.address].filter(Boolean).join(' • ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold">Quotation</p>
                  <p className="text-lg font-bold mt-0.5">{previewQuote.quoteNumber}</p>
                  <Badge className={STATUS_BADGE[previewQuote.status] || STATUS_BADGE.Draft}>{previewQuote.status}</Badge>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Prepared For</p>
                    <p className="font-semibold text-slate-900 mt-1">{previewQuote.customerName}</p>
                    <p className="text-slate-600 text-xs">{previewQuote.customerEmail}</p>
                    <p className="text-slate-600 text-xs">{previewQuote.customerAddress}</p>
                  </div>
                  <div className="text-right text-xs text-slate-600 space-y-1">
                    <p><strong>Issue Date:</strong> {formatDate(previewQuote.issueDate)}</p>
                    <p><strong>Valid Until:</strong> {formatDate(previewQuote.validUntil)}</p>
                    <p><strong>Subject:</strong> {previewQuote.title}</p>
                  </div>
                </div>
                <table className="w-full text-sm border-t border-b border-slate-200">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Service</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(previewQuote.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.description} <span className="text-xs text-slate-400">({it.unit})</span></td>
                        <td className="py-2.5 px-3 text-right">{it.qty}</td>
                        <td className="py-2.5 px-3 text-right">{formatCurrency(it.unitPrice, currency)}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(it.total, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(previewQuote.subtotal, currency)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Discount</span><span>- {formatCurrency(previewQuote.discountAmount, currency)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Tax ({previewQuote.taxRate}%)</span><span>{formatCurrency(previewQuote.taxAmount, currency)}</span></div>
                    <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                      <span>Total</span><span>{formatCurrency(previewQuote.total, currency)}</span>
                    </div>
                  </div>
                </div>
                {previewQuote.terms && (
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-4"><strong>Terms:</strong> {previewQuote.terms}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreviewQuote(null)}>Close</Button>
              <Button onClick={() => exportQuotationPdf(previewQuote, business)}>
                <Download className="w-4 h-4" /> Export PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
