export const CURRENCIES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'INR', label: 'INR (Rs.)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'EUR', label: 'EUR (€)' }
];

export const INDUSTRY_OPTIONS = [
  'Residential Cleaning',
  'Commercial Cleaning',
  'Deep & Move-Out Cleaning',
  'Landscaping & Lawn Care',
  'HVAC & Home Maintenance',
  'Pest Control',
  'General Home Services'
];

export const DEFAULT_CLEANING_SERVICES = [
  {
    id: 'srv_std_clean',
    name: 'Standard Residential Cleaning',
    unit: 'Flat Rate',
    price: 120,
    description: 'Kitchen, bathrooms, bedrooms, dusting, vacuuming, and mopping'
  },
  {
    id: 'srv_deep_clean',
    name: 'Deep Cleaning Package',
    unit: 'Flat Rate',
    price: 240,
    description: 'Baseboards, inside cabinets & appliances, grout & sanitization'
  },
  {
    id: 'srv_move_clean',
    name: 'Move-In / Move-Out Cleaning',
    unit: 'Flat Rate',
    price: 310,
    description: 'Full empty-home turnaround clean ready for inspection'
  },
  {
    id: 'srv_hourly',
    name: 'Extra Cleaner Labor',
    unit: 'Per Hour',
    price: 45,
    description: 'Additional labor hours for larger homes or custom requests'
  },
  {
    id: 'srv_windows',
    name: 'Interior Window & Track Detailing',
    unit: 'Per Room',
    price: 18,
    description: 'Interior glass, sills, and tracks per room'
  }
];

export const LEAD_STAGES = [
  { id: 'New Inquiry', label: 'New Inquiry', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'AI Analyzed', label: 'AI Analyzed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'Qualified', label: 'Qualified', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Quote Sent', label: 'Quote Sent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'Won', label: 'Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Lost', label: 'Lost', color: 'bg-rose-50 text-rose-700 border-rose-200' }
];

export const LOST_REASONS = [
  'Price Too High',
  'No Response / Ghosted',
  'Chose Competitor',
  'Schedule Unavailable',
  'Out of Service Area',
  'Scope Changed / Cancelled',
  'Other'
];

export const PLAN_LIMITS = {
  starter: {
    name: 'Starter Free',
    priceLabel: '$0 / month',
    aiCallsPerMonth: 25,
    quotesPerMonth: 20,
    maxTeamMembers: 2,
    description: 'For independent service owners testing AI lead qualification.'
  },
  growth: {
    name: 'Growth',
    priceLabel: '$29 / month',
    aiCallsPerMonth: 250,
    quotesPerMonth: 200,
    maxTeamMembers: 6,
    description: 'For growing residential cleaning teams with active pipelines.'
  },
  pro: {
    name: 'Pro Studio',
    priceLabel: '$79 / month',
    aiCallsPerMonth: 1500,
    quotesPerMonth: 2000,
    maxTeamMembers: 25,
    description: 'High-volume multi-crew operations and full reporting.'
  }
};

export function formatCurrency(amount, currencyCode = 'USD') {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2
    }).format(num);
  } catch {
    return (currencyCode || 'USD') + ' ' + num.toFixed(2);
  }
}

export function formatDate(value) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return y + '-' + m;
}

export function badgeColorForStage(stage) {
  const found = LEAD_STAGES.find((s) => s.id === stage);
  return found ? found.color : 'bg-slate-100 text-slate-700 border-slate-200';
}
