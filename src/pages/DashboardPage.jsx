import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Clock, DollarSign, Kanban, Sparkles, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { badgeColorForStage, formatCurrency, formatDate } from '../utils/formatters';
import { Badge, Button, Card, EmptyState, StatCard } from '../components/UI';

export default function DashboardPage() {
  const { business, leads, quotations, followups } = useAuth();
  const navigate = useNavigate();
  const currency = business?.currency || 'USD';

  const wonQuotesValue = quotations
    .filter((q) => q.status === 'Accepted')
    .reduce((sum, q) => sum + Number(q.total || 0), 0);

  const openPipelineValue = leads
    .filter((l) => l.stage !== 'Won' && l.stage !== 'Lost')
    .reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

  const wonLeadsCount = leads.filter((l) => l.stage === 'Won').length;
  const closedLeadsCount = leads.filter((l) => l.stage === 'Won' || l.stage === 'Lost').length;
  const winRate = closedLeadsCount > 0 ? Math.round((wonLeadsCount / closedLeadsCount) * 100) : 0;
  const pendingFollowups = followups.filter((f) => f.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live metrics calculated directly from your saved leads, quotations, and follow-ups.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => navigate('/app/leads')}>
            <Kanban className="w-4 h-4" /> Add Lead
          </Button>
          <Button onClick={() => navigate('/app/ai-intelligence')}>
            <Sparkles className="w-4 h-4" /> AI Analyze Inquiry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Inquiries"
          value={leads.length}
          hint={leads.filter((l) => l.aiAnalysis).length + ' analyzed by AI'}
          icon={Users}
          accent="blue"
        />
        <StatCard
          label="Active Pipeline"
          value={formatCurrency(openPipelineValue, currency)}
          hint="Open estimated opportunities"
          icon={DollarSign}
          accent="indigo"
        />
        <StatCard
          label="Accepted Quotes"
          value={formatCurrency(wonQuotesValue, currency)}
          hint={'Win rate: ' + winRate + '% (' + wonLeadsCount + ' won)'}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Pending Follow-ups"
          value={pendingFollowups.length}
          hint={quotations.length + ' total quotations saved'}
          icon={Clock}
          accent="amber"
        />
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Your pipeline is ready for your first inquiry"
          description="Add a real customer inquiry in Leads or analyze one directly in AI Intelligence to begin building quotations and tracking conversions."
          action={
            <Button onClick={() => navigate('/app/ai-intelligence')}>
              <Sparkles className="w-4 h-4" /> Analyze First Inquiry
            </Button>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Recent Inquiries</h2>
              <button
                onClick={() => navigate('/app/leads')}
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                View Pipeline <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 6).map((lead) => (
                <div key={lead.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{lead.customerName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {lead.serviceRequested || 'Service inquiry'} • {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {lead.aiAnalysis?.score !== undefined && (
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        AI {lead.aiAnalysis.score}/100
                      </span>
                    )}
                    <Badge className={badgeColorForStage(lead.stage)}>{lead.stage}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Upcoming Follow-ups</h2>
              <button
                onClick={() => navigate('/app/follow-ups')}
                className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {pendingFollowups.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No pending follow-ups scheduled.</p>
            ) : (
              <div className="space-y-3">
                {pendingFollowups.slice(0, 5).map((f) => (
                  <div key={f.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{f.leadName || 'Customer'}</p>
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Due {formatDate(f.dueDate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{f.note || f.channel}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
