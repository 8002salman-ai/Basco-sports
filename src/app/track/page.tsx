'use client';

import { useState } from 'react';
import { Package, Search, Clock, CheckCircle2, Truck, XCircle, ArrowRight } from 'lucide-react';

interface TrackedOrder {
  orderNumber: string;
  status: string;
  items: { name: string; quantity: number; price: number; variantLabel?: string }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  coupon?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Package; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  paid: { label: 'Payment Confirmed', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  refunded: { label: 'Refunded', icon: XCircle, color: 'text-stone-500', bg: 'bg-stone-100' },
};

const TIMELINE = ['pending', 'paid', 'shipped', 'delivered'];

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function TrackOrderPage() {
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const resp = await fetch(`/api/orders/lookup?q=${encodeURIComponent(q)}`);
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Lookup failed');
      setOrders(data.data || []);
    } catch (err) {
      setError((err as Error).message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-obsidian text-white mx-auto flex items-center justify-center">
          <Package className="w-7 h-7" />
        </div>
        <h1 className="mt-5 font-display text-[32px] lg:text-[40px] leading-none">Track your order</h1>
        <p className="mt-3 text-obsidian/60 text-[15px]">
          Enter your email address or order number to see your order status.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-[560px] mx-auto">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Email or order number (e.g. BS-552113)"
            className="w-full h-13 pl-11 pr-4 rounded-full border-2 border-stone-200 text-[14px] focus:outline-none focus:border-obsidian/30 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-13 px-8 rounded-full bg-obsidian text-white font-semibold text-[14px] flex items-center gap-2 disabled:opacity-50 hover:bg-obsidian-700 transition-colors"
        >
          {loading ? 'Searching…' : 'Track'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-[16px] bg-red-50 border border-red-200 text-[13px] text-red-700 text-center max-w-[560px] mx-auto">
          {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && !error && (
        <div className="mt-10">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-obsidian/20 mx-auto" />
              <p className="mt-4 text-obsidian/50 text-[15px]">No orders found for &quot;{query}&quot;</p>
              <p className="mt-1 text-[13px] text-obsidian/40">Try your email address or a different order number.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-[13px] text-obsidian/50">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>

              {orders.map((order) => {
                const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon = config.icon;
                const currentIdx = TIMELINE.indexOf(order.status);

                return (
                  <div key={order.orderNumber} className="bg-white rounded-[20px] border border-stone-200 overflow-hidden">
                    {/* Order Header */}
                    <div className="p-6 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Order</div>
                        <div className="text-[18px] font-display font-bold">{order.orderNumber}</div>
                        <div className="text-[12px] text-obsidian/50 mt-0.5">{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5 ${config.color} ${config.bg}`}>
                          <Icon size={14} />
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {!['cancelled', 'refunded'].includes(order.status) && (
                      <div className="px-6 py-4 border-b border-stone-100">
                        <div className="flex items-center justify-between max-w-[480px] mx-auto">
                          {TIMELINE.map((step, idx) => {
                            const stepConfig = STATUS_CONFIG[step];
                            const StepIcon = stepConfig.icon;
                            const isCompleted = idx <= currentIdx;
                            const isCurrent = idx === currentIdx;

                            return (
                              <div key={step} className="flex flex-col items-center relative">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                  isCompleted ? `${stepConfig.bg} ${stepConfig.color}` : 'bg-stone-100 text-obsidian/30'
                                } ${isCurrent ? 'ring-2 ring-offset-2 ring-obsidian/20' : ''}`}>
                                  <StepIcon size={16} />
                                </div>
                                <span className={`mt-2 text-[10px] font-medium ${isCompleted ? 'text-obsidian/70' : 'text-obsidian/30'}`}>
                                  {stepConfig.label}
                                </span>
                                {idx < TIMELINE.length - 1 && (
                                  <div className={`absolute top-4 left-[calc(100%+4px)] w-[calc(100%-8px)] h-[2px] ${
                                    idx < currentIdx ? 'bg-obsidian/40' : 'bg-stone-200'
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="p-6">
                      <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[13px]">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.variantLabel && <span className="text-obsidian/50 ml-1">({item.variantLabel})</span>}
                              <span className="text-obsidian/40 ml-1">×{item.quantity}</span>
                            </div>
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="mt-4 pt-4 border-t border-stone-100 space-y-1.5 text-[13px]">
                        <div className="flex justify-between"><span className="text-obsidian/60">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-lime-600"><span>Discount{order.coupon ? ` (${order.coupon})` : ''}</span><span>-{formatPrice(order.discount)}</span></div>
                        )}
                        <div className="flex justify-between"><span className="text-obsidian/60">Tax</span><span>{formatPrice(order.tax)}</span></div>
                        <div className="flex justify-between font-semibold text-[15px] pt-2 border-t"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
