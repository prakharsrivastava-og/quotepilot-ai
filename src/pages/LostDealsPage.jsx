import React, { useMemo, useState } from 'react';
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
