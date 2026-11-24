import React, { useMemo } from 'react';
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
