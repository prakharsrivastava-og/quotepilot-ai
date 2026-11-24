import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { checkBackendHealth } from '../services/aiService';
import { PLAN_LIMITS } from '../utils/formatters';
import { AlertBanner, Badge, Button, Card, Modal } from '../components/UI';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function SubscriptionPage() {
  const { business, aiCallsUsed, quotesUsed, team, planLimits } = useAuth();
  const [billingReady, setBillingReady] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [modalPlan, setModalPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentPlan = business?.plan || 'starter';

  useEffect(() => {
    checkBackendHealth()
      .then((data) => setBillingReady(Boolean(data?.integrations?.billing)))
      .catch(() => setBillingReady(false))
      .finally(() => setLoadingHealth(false));
  }, []);

  const handleUpgradeClick = async (planKey, plan) => {
    setErrorMsg('');
    if (planKey === 'starter' || planKey === currentPlan) return;

    if (!billingReady) {
      setModalPlan({ key: planKey, ...plan });
      return;
    }

    setCheckoutLoading(planKey);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch(API_BASE + '/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify({
          planKey,
          businessId: business?.id || '',
          successUrl: window.location.origin + '/app/subscription?checkout=success',
          cancelUrl: window.location.origin + '/app/subscription?checkout=cancelled'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Checkout session could not be created.');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setErrorMsg(err.message || 'Payment checkout failed.');
    } finally {
      setCheckoutLoading('');
    }
  };

  const aiPct = Math.min(100, Math.round((aiCallsUsed / planLimits.aiCallsPerMonth) * 100));
  const quotePct = Math.min(100, Math.round((quotesUsed / planLimits.quotesPerMonth) * 100));
  const teamPct = Math.min(100, Math.round((team.length / planLimits.maxTeamMembers) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription & Usage Limits</h1>
        <p className="text-sm text-slate-500 mt-1">
          Usage limits are enforced in real time. Paid plan upgrades require verified payment checkout.
        </p>
      </div>

      {!loadingHealth && !billingReady && (
        <AlertBanner
          type="warning"
          title="Payment Gateway Required for Paid Upgrades"
          message="Your workspace is protected against unpaid plan switching. Configure STRIPE_SECRET_KEY, STRIPE_PRICE_GROWTH, STRIPE_PRICE_PRO, and a webhook on the backend to accept real subscription payments."
        />
      )}

      {errorMsg && <AlertBanner type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

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
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: teamPct + '%' }} />
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {Object.entries(PLAN_LIMITS).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          const isPaid = key !== 'starter';
          return (
            <Card key={key} className={'p-6 flex flex-col justify-between ' + (isCurrent ? 'border-blue-600 ring-1 ring-blue-600' : '')}>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                  {isCurrent && <Badge className="bg-blue-50 text-blue-700 border-blue-200">Active</Badge>}
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{plan.priceLabel}</p>
                <p className="text-xs text-slate-500 mt-2">{plan.description}</p>
                <ul className="mt-5 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {plan.aiCallsPerMonth} AI analyses / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {plan.quotesPerMonth} quotations / month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Up to {plan.maxTeamMembers} team seats</li>
                </ul>
              </div>

              {isCurrent ? (
                <Button className="mt-6 w-full" variant="secondary" disabled>
                  Current Plan
                </Button>
              ) : isPaid ? (
                <Button
                  className="mt-6 w-full"
                  loading={checkoutLoading === key}
                  onClick={() => handleUpgradeClick(key, plan)}
                >
                  {billingReady ? <CreditCard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {billingReady ? 'Subscribe (' + plan.priceLabel + ')' : 'Upgrade — Payment Required'}
                </Button>
              ) : (
                <Button className="mt-6 w-full" variant="secondary" disabled>
                  Included Free Tier
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={Boolean(modalPlan)}
        onClose={() => setModalPlan(null)}
        title={'Upgrade to ' + (modalPlan?.name || '') + ' (' + (modalPlan?.priceLabel || '') + ')'}
      >
        <div className="space-y-4 text-sm text-slate-700">
          <AlertBanner
            type="warning"
            title="Checkout Blocked — Billing Credentials Not Configured"
            message="QuotePilot AI does not allow switching to paid plans without a verified payment. No charge was made and your account remains on Starter Free."
          />
          <p className="text-xs text-slate-600">
            To enable real paid upgrades for your customers:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
            <li>Add <code className="px-1 bg-slate-100 rounded">STRIPE_SECRET_KEY</code>, <code className="px-1 bg-slate-100 rounded">STRIPE_PRICE_GROWTH</code>, and <code className="px-1 bg-slate-100 rounded">STRIPE_PRICE_PRO</code> in <code className="px-1 bg-slate-100 rounded">server/.env</code>.</li>
            <li>Connect a Stripe webhook (<code className="px-1 bg-slate-100 rounded">checkout.session.completed</code>) using Firebase Admin SDK to update the business <code className="px-1 bg-slate-100 rounded">plan</code> field after payment succeeds.</li>
          </ol>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setModalPlan(null)}>Understood</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
