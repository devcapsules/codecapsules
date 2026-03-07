import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_WORKERS_API_URL
    || process.env.NEXT_PUBLIC_API_URL
    || 'http://localhost:8787';
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Hobby (Free)',
  creator: 'Creator',
  team: 'Pro / Bootcamp',
  enterprise: 'Enterprise',
};

export default function Account() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeGrants, setActiveGrants] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchBilling = useCallback(async () => {
    try {
      setSubLoading(true);
      const apiUrl = getApiUrl();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const [subRes, historyRes, voucherRes, usageRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/payments/subscription`, { headers }),
        fetch(`${apiUrl}/api/v1/payments/history`, { headers }),
        fetch(`${apiUrl}/api/v1/vouchers/status`, { headers }),
        fetch(`${apiUrl}/api/v1/payments/usage`, { headers }),
      ]);

      if (subRes.ok) {
        const subJson = await subRes.json();
        if (subJson.success) setSubscription(subJson.data);
      }
      if (historyRes.ok) {
        const histJson = await historyRes.json();
        if (histJson.success) setPayments(histJson.data || []);
      }
      if (voucherRes.ok) {
        const vJson = await voucherRes.json();
        if (vJson.success) setActiveGrants(vJson.data?.activeGrants || []);
      }
      if (usageRes.ok) {
        const uJson = await usageRes.json();
        if (uJson.success) setUsage(uJson.data);
      }
    } catch (err) {
      console.error('Failed to fetch billing:', err);
    } finally {
      setSubLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user && session?.access_token) fetchBilling();
  }, [user, session?.access_token, fetchBilling]);

  const handleUpgrade = async (plan: string) => {
    try {
      const apiUrl = getApiUrl();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${apiUrl}/api/v1/payments/create-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!json.success) { alert(json.error || 'Failed to create order'); return; }

      const { orderId, amount, currency, description, keyId, prefill } = json.data;

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.head.appendChild(s);
        });
      }

      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount, currency,
        name: 'DevCapsules',
        description,
        order_id: orderId,
        prefill,
        theme: { color: '#00ff87' },
        handler: async (response: any) => {
          const verifyRes = await fetch(`${apiUrl}/api/v1/payments/verify`, {
            method: 'POST', headers,
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyJson = await verifyRes.json();
          if (verifyJson.success) {
            alert(verifyJson.data.message);
            window.location.reload();
          } else {
            alert('Payment verification failed. Contact support.');
          }
        },
      });
      rzp.open();
    } catch (err) {
      console.error('Upgrade error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? You\'ll keep access until the end of your billing period.')) return;
    try {
      setCancelling(true);
      const apiUrl = getApiUrl();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch(`${apiUrl}/api/v1/payments/cancel`, { method: 'POST', headers });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message);
        fetchBilling();
      } else {
        alert(json.error || 'Failed to cancel');
      }
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setCancelling(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      setVoucherLoading(true);
      setVoucherMsg(null);
      const apiUrl = getApiUrl();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch(`${apiUrl}/api/v1/vouchers/redeem`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setVoucherMsg({ type: 'success', text: json.data.message });
        setVoucherCode('');
        fetchBilling(); // Refresh subscription data
      } else {
        setVoucherMsg({ type: 'error', text: json.error || 'Invalid voucher code' });
      }
    } catch (err) {
      setVoucherMsg({ type: 'error', text: 'Failed to redeem voucher. Please try again.' });
    } finally {
      setVoucherLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400">Manage your account preferences and subscription</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={user.user_metadata?.full_name || ''}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user.email || ''}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Subscription & Billing */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Subscription</h2>
            {subLoading ? (
              <div className="animate-pulse h-16 bg-slate-700 rounded-lg"></div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        subscription?.plan === 'free' ? 'bg-slate-600 text-slate-200' :
                        subscription?.plan === 'creator' ? 'bg-green-600 text-green-100' :
                        'bg-purple-600 text-purple-100'
                      }`}>
                        {PLAN_LABELS[subscription?.plan] || 'Free'}
                      </span>
                      {subscription?.subscription?.cancelAtPeriodEnd && (
                        <span className="bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded text-xs">Cancels at period end</span>
                      )}
                    </div>
                    {subscription?.subscription ? (
                      <p className="text-slate-400 text-sm">
                        Active until {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    ) : (
                      <p className="text-slate-400 text-sm">Free tier — upgrade for premium analytics, white label, and more</p>
                    )}
                  </div>
                  {subscription?.plan !== 'free' && !subscription?.subscription?.cancelAtPeriodEnd && (
                    <button 
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Plan'}
                    </button>
                  )}
                </div>

                {/* Upgrade options for free users */}
                {subscription?.plan === 'free' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => handleUpgrade('creator')}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all text-left"
                    >
                      <div className="font-semibold">Creator Plan — <span className="line-through text-green-300/60">₹2,999</span> ₹2,499/mo</div>
                      <div className="text-green-200 text-xs mt-0.5">10K executions, 50 generations, white label</div>
                    </button>
                    <button
                      onClick={() => handleUpgrade('team')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all text-left"
                    >
                      <div className="font-semibold">Pro / Bootcamp — ₹8,299/mo</div>
                      <div className="text-purple-200 text-xs mt-0.5">100K executions, 500 generations, advanced analytics</div>
                    </button>
                  </div>
                )}

                {/* Quotas & Usage */}
                {usage && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-slate-400 mb-3">Monthly Usage</div>
                    <div className="space-y-3">
                      {/* Executions */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">Code Executions</span>
                          <span className="text-white font-medium">
                            {usage.execution.limit > 0
                              ? <>{usage.execution.remaining.toLocaleString()} <span className="text-slate-500">remaining of {usage.execution.limit.toLocaleString()}</span></>
                              : 'Unlimited'}
                          </span>
                        </div>
                        {usage.execution.limit > 0 && (
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                usage.execution.used / usage.execution.limit > 0.9 ? 'bg-red-500' :
                                usage.execution.used / usage.execution.limit > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (usage.execution.used / usage.execution.limit) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {/* Generations */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">AI Generations</span>
                          <span className="text-white font-medium">
                            {usage.generation.limit > 0
                              ? <>{usage.generation.remaining} <span className="text-slate-500">remaining of {usage.generation.limit}</span></>
                              : 'Unlimited'}
                          </span>
                        </div>
                        {usage.generation.limit > 0 && (
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                usage.generation.used / usage.generation.limit > 0.9 ? 'bg-red-500' :
                                usage.generation.used / usage.generation.limit > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (usage.generation.used / usage.generation.limit) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {/* Capsules */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">Total Capsules</span>
                          <span className="text-white font-medium">{usage.capsules.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Voucher / Coupon Redemption */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Redeem Voucher</h2>
            <p className="text-slate-400 text-sm mb-4">Have a voucher code? Enter it below to activate your plan upgrade.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleRedeemVoucher()}
                placeholder="Enter voucher code (e.g. PILOT3MO)"
                className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono tracking-wider"
                maxLength={32}
              />
              <button
                onClick={handleRedeemVoucher}
                disabled={voucherLoading || !voucherCode.trim()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
              >
                {voucherLoading ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
            {voucherMsg && (
              <div className={`mt-3 px-4 py-2 rounded-lg text-sm ${
                voucherMsg.type === 'success' 
                  ? 'bg-green-600/20 border border-green-600/30 text-green-300' 
                  : 'bg-red-600/20 border border-red-600/30 text-red-300'
              }`}>
                {voucherMsg.text}
              </div>
            )}

            {/* Active voucher grants */}
            {activeGrants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-sm text-slate-400 mb-2">Active Voucher Grants</div>
                {activeGrants.map((g: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 bg-green-600/5 border border-green-600/20 rounded-lg px-4 mt-2">
                    <div>
                      <span className="text-green-400 font-medium text-sm">{PLAN_LABELS[g.plan] || g.plan} Plan</span>
                      <span className="text-slate-500 text-xs ml-2">via {g.voucherCode}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-300 text-sm font-medium">{g.daysRemaining} days remaining</div>
                      <div className="text-slate-500 text-xs">Expires {new Date(g.grantedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
              <div className="space-y-3">
                {payments.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                    <div>
                      <div className="text-sm text-white font-medium">{PLAN_LABELS[p.plan] || p.plan} Plan</div>
                      <div className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white font-medium">{p.displayAmount}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.status === 'captured' ? 'bg-green-600/20 text-green-400' :
                        p.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                        p.status === 'refunded' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-slate-600/20 text-slate-400'
                      }`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Summary */}
          {usage && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{usage.capsules.count}</div>
                <div className="text-sm text-slate-400">Total Capsules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {usage.execution.limit > 0 ? usage.execution.remaining.toLocaleString() : '∞'}
                </div>
                <div className="text-sm text-slate-400">Runs Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {usage.generation.limit > 0 ? usage.generation.remaining : '∞'}
                </div>
                <div className="text-sm text-slate-400">Generations Remaining</div>
              </div>
            </div>
          </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Export Data</div>
                  <div className="text-sm text-slate-400">Download all your capsules and analytics</div>
                </div>
                <button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Export
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Delete Account</div>
                  <div className="text-sm text-slate-400">Permanently delete your account and all data</div>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}