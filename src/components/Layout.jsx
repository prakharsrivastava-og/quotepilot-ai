import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, Briefcase, Clock, CreditCard, FileText, Kanban,
  LayoutDashboard, LogOut, Menu, Plug, Settings, Sparkles,
  TrendingDown, UserPlus, Users, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/leads', label: 'Leads', icon: Kanban },
  { to: '/app/ai-intelligence', label: 'AI Intelligence', icon: Sparkles, highlight: true },
  { to: '/app/quotations', label: 'Quotations', icon: FileText },
  { to: '/app/customers', label: 'Customers', icon: Users },
  { to: '/app/follow-ups', label: 'Follow-ups', icon: Clock },
  { to: '/app/analytics', label: 'Sales Analytics', icon: BarChart3 },
  { to: '/app/lost-deals', label: 'Lost Deals', icon: TrendingDown },
  { to: '/app/team', label: 'Team', icon: UserPlus },
  { to: '/app/integrations', label: 'Integrations', icon: Plug },
  { to: '/app/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/app/settings', label: 'Settings', icon: Settings }
];

export default function Layout() {
  const { business, userProfile, logout, aiCallsUsed, planLimits } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-navy-900 text-slate-200">
      <div className="flex items-center justify-between px-5 h-16 border-b border-navy-700/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            QP
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">QuotePilot AI</p>
            <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[140px]">
              {business?.name || 'Workspace'}
            </p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : item.highlight
                  ? 'text-blue-300 hover:bg-navy-800 hover:text-white'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white')
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-navy-700/80 space-y-3">
        <div className="bg-navy-800/80 rounded-lg p-3 border border-navy-700">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span>AI Quota ({planLimits.name})</span>
            <span className="font-semibold text-white">{aiCallsUsed}/{planLimits.aiCallsPerMonth}</span>
          </div>
          <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: Math.min(100, Math.round((aiCallsUsed / planLimits.aiCallsPerMonth) * 100)) + '%' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{userProfile?.displayName || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{userProfile?.role || 'Owner'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 max-w-full h-full z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Briefcase className="w-4 h-4 text-slate-400 hidden sm:block" />
              <span className="font-medium text-slate-800">{business?.name || 'QuotePilot AI'}</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline text-xs text-slate-500">{business?.industry || 'Residential Cleaning'}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/ai-intelligence')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze Inquiry
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
