'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ShoppingCart, CurrencyDollar, Truck, CheckCircle, Printer, Eye, Plus, Gift,
  Users as UsersIcon, Star, WarningCircle, Megaphone, Prohibit,
} from '@phosphor-icons/react';
import {
  Badge, Button, Card, DataNotice, DemoNotice, Drawer, EmptyState, Field, INPUT_CLS, KeyValue,
  Modal, Notice, PageHeader, ProgressBar, SELECT_CLS, StatCard, StatGrid, Tabs, Toolbar, Toggle,
} from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import {
  orders as orderSeed, ORDER_STATUS_TONE, formatMoney, formatDate, adminUsers, adminReviews,
  giftDrop, giftDropClaims, campaigns, catalogSeed,
  type DemoCampaign,
} from '@/features/admin/demo/data';
import { aggregateApprovedReviews, type AdminOrder, type AdminOrderItem, type AdminReview, type AdminUser, type AdminProduct, type OrderStatus } from '@/lib/admin/types';
import { useAdminTable } from '@/hooks/use-admin-table';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

/** Opens a clean, printable invoice in its own window (no PDF library needed). */
function printInvoice(order: AdminOrder) {
  const win = window.open('', '_blank', 'width=820,height=920');
  if (!win) return;
  const rows = order.items
    .map(
      (it: AdminOrderItem) =>
        `<tr><td>${escapeHtml(it.name)}${it.variantLabel ? ` <span class="muted">${escapeHtml(it.variantLabel)}</span>` : ''}</td><td class="num">${it.quantity}</td><td class="num">$${it.price.toFixed(2)}</td><td class="num">$${(it.price * it.quantity).toFixed(2)}</td></tr>`
    )
    .join('');
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title>
<style>
  body{font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#0b1220;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:20px;margin:0} h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:24px 0 8px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0b1220;padding-bottom:12px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{padding:8px 4px;border-bottom:1px solid #e2e8f0;text-align:left}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b}
  .num{text-align:right} .muted{color:#94a3b8} .totals{margin-top:12px;width:260px;margin-left:auto}
  .totals div{display:flex;justify-content:space-between;padding:3px 0} .totals .grand{border-top:2px solid #0b1220;font-weight:700;margin-top:6px;padding-top:6px}
  .foot{margin-top:32px;font-size:11px;color:#64748b}
</style></head><body>
<div class="head">
  <div><h1>BASCO SPORTS</h1><div class="muted">Premium performance gear</div></div>
  <div style="text-align:right"><div style="font-weight:700">INVOICE</div><div>${order.orderNumber}</div><div class="muted">${formatDate(order.createdAt)}</div></div>
</div>
<h2>Billed to</h2>
<div>${escapeHtml(order.customerName || '—')}<br><span class="muted">${escapeHtml(order.customerEmail)}</span></div>
<h2>Items</h2>
<table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Total</th></tr></thead><tbody>${rows}</tbody></table>
<div class="totals">
  <div><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
  <div><span>Discount${order.coupon ? ` (${order.coupon})` : ''}</span><span>-$${order.discount.toFixed(2)}</span></div>
  <div><span>Tax</span><span>$${order.tax.toFixed(2)}</span></div>
  <div class="grand"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
</div>
<div class="foot">Demo invoice generated from local demo data — no payment was captured. Status: ${order.status}.</div>
</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function OrdersView() {
  const { rows, source, error, save } = useAdminTable<AdminOrder>('orders', orderSeed);
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [open, setOpen] = useState<AdminOrder | null>(null);

  const stats = useMemo(() => {
    const paidOnly = rows.filter((o) => o.status !== 'cancelled' && o.status !== 'pending');
    return {
      total: rows.length,
      revenue: paidOnly.reduce((a, o) => a + o.total, 0),
      needsFulfilment: rows.filter((o) => o.status === 'paid').length,
      shippedOrDelivered: rows.filter((o) => o.status === 'shipped' || o.status === 'delivered').length,
    };
  }, [rows]);

  const filtered = status === 'all' ? rows : rows.filter((o) => o.status === status);
  const current = open ? rows.find((o) => o.id === open.id) ?? open : null;

  const setOrderStatus = async (id: string, next: OrderStatus) => {
    const order = rows.find((o) => o.id === id);
    if (!order) return;
    const updated = { ...order, status: next, updatedAt: new Date().toISOString() };
    if (await save(updated)) setOpen(updated);
  };

  const columns: Column<AdminOrder>[] = [
    { key: 'number', header: 'Order', cell: (o) => <span className="font-mono text-[12px] font-semibold text-gray-900">{o.orderNumber}</span>, sortValue: (o) => o.orderNumber },
    { key: 'customer', header: 'Customer', cell: (o) => <div className="min-w-0"><div className="truncate">{o.customerName || '—'}</div><div className="text-[10px] text-gray-400 truncate">{o.customerEmail}</div></div>, sortValue: (o) => o.customerName || o.customerEmail },
    { key: 'items', header: 'Items', align: 'right', cell: (o) => <span className="text-gray-600">{o.items.reduce((a, i) => a + i.quantity, 0)}</span>, sortValue: (o) => o.items.length },
    { key: 'status', header: 'Status', cell: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge>, sortValue: (o) => o.status },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => <span className="font-semibold">{formatMoney(o.total)}</span>, sortValue: (o) => o.total },
    { key: 'date', header: 'Placed', cell: (o) => <span className="text-gray-500">{formatDate(o.createdAt)}</span>, sortValue: (o) => o.createdAt },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Orders" subtitle="Paid-only aggregates — cancelled and pending rows never inflate revenue." />
      <DataNotice source={source} error={error} />

      <StatGrid>
        <StatCard label="Total orders" value={stats.total} hint="all statuses" icon={<ShoppingCart size={15} weight="bold" />} tone="blue" />
        <StatCard label="Revenue" value={formatMoney(stats.revenue)} hint="excludes cancelled" icon={<CurrencyDollar size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Needs fulfilment" value={stats.needsFulfilment} hint="paid, not shipped" icon={<Truck size={15} weight="bold" />} tone="amber" />
        <StatCard label="Shipped / delivered" value={stats.shippedOrDelivered} hint="completed lifecycle" icon={<CheckCircle size={15} weight="bold" />} tone="violet" />
      </StatGrid>

      <Card>
        <Toolbar className="mb-3">
          <select className={SELECT_CLS} value={status} onChange={(e) => setStatus(e.target.value as 'all' | OrderStatus)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex-1" />
          <Button variant="secondary" onClick={() => printInvoice(filtered[0] ?? rows[0])} disabled={!rows.length}><Printer size={14} weight="bold" /> Print latest invoice</Button>
        </Toolbar>
        <DataTable
          rows={filtered}
          columns={columns}
          perPage={10}
          onRowClick={(o) => setOpen(o)}
          empty={{ title: 'No orders with this status', hint: 'Place a demo order on the storefront to see it here.', icon: <ShoppingCart size={16} /> }}
          rowActions={(o) => (
            <button type="button" onClick={() => setOpen(o)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`View ${o.orderNumber}`} title="View order"><Eye size={14} /></button>
          )}
        />
      </Card>

      <Drawer
        open={!!current}
        onClose={() => setOpen(null)}
        title={current ? `Order ${current.orderNumber}` : 'Order'}
        width="max-w-2xl"
        footer={
          current && (
            <>
              <Button variant="secondary" onClick={() => printInvoice(current)}><Printer size={14} weight="bold" /> Invoice</Button>
              {current.status === 'paid' && <Button onClick={() => setOrderStatus(current.id, 'shipped')}><Truck size={14} weight="bold" /> Mark shipped</Button>}
              {current.status === 'shipped' && <Button onClick={() => setOrderStatus(current.id, 'delivered')}><CheckCircle size={14} weight="bold" /> Mark delivered</Button>}
            </>
          )
        }
      >
        {current && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={ORDER_STATUS_TONE[current.status]}>{current.status}</Badge>
              <span className="text-[12px] text-gray-500">Placed {formatDate(current.createdAt)}</span>
              <div className="ml-auto flex items-center gap-2">
                <label className="text-[11px] text-gray-500" htmlFor="order-status">Status</label>
                <select id="order-status" className={SELECT_CLS} value={current.status} onChange={(e) => setOrderStatus(current.id, e.target.value as OrderStatus)}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <KeyValue
              items={[
                { label: 'Customer', value: current.customerName || '—' },
                { label: 'Email', value: current.customerEmail },
                { label: 'Coupon', value: current.coupon || 'none' },
                { label: 'Currency', value: current.currency.toUpperCase() },
              ]}
            />

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Items</h4>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                {current.items.map((it) => (
                  <div key={it.id} className="px-3 py-2.5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-gray-800 truncate">{it.name}</div>
                      {it.variantLabel && <div className="text-[11px] text-gray-400">{it.variantLabel}</div>}
                      {!it.productId && <div className="text-[10px] text-amber-600">Legacy row — no product id, so review verification falls back to a name match.</div>}
                    </div>
                    <span className="text-[12px] text-gray-500">× {it.quantity}</span>
                    <span className="text-[12px] font-semibold w-16 text-right">{formatMoney(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 space-y-1.5">
              <div className="flex justify-between text-[12px]"><span className="text-gray-500">Subtotal</span><span>{formatMoney(current.subtotal)}</span></div>
              <div className="flex justify-between text-[12px]"><span className="text-gray-500">Discount</span><span className="text-emerald-600">−{formatMoney(current.discount)}</span></div>
              <div className="flex justify-between text-[12px]"><span className="text-gray-500">Tax</span><span>{formatMoney(current.tax)}</span></div>
              <div className="flex justify-between text-[13px] font-bold border-t border-gray-200 pt-1.5"><span>Total</span><span>{formatMoney(current.total)}</span></div>
            </div>

            <Notice tone="blue">Fulfilment actions here update local demo state. ERP sync, shipping labels and refunds need Basco’s own provider keys.</Notice>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function UsersView() {
  const { rows, source, error, save } = useAdminTable<AdminUser>('users', adminUsers);
  const [tab, setTab] = useState<'customers' | 'pending' | 'team'>('customers');
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '' });

  // Signup at /account is open, so a new account starts unapproved and sees no
  // orders until it is approved here.
  const customers = rows.filter((u) => u.role === 'buyer' && u.verified !== false);
  const pending = rows.filter((u) => u.role === 'buyer' && u.verified === false);
  const team = rows.filter((u) => u.role === 'admin');
  const shown = tab === 'customers' ? customers : tab === 'team' ? team : pending;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        subtitle="Customers and admin team members, straight from the store database."
        actions={<Button onClick={() => setAddOpen(true)}><Plus size={14} weight="bold" /> Add user</Button>}
      />
      <DataNotice source={source} error={error} />

      <Card bodyClass="p-0">
        <div className="px-3">
          <Tabs
            tabs={[
              { key: 'customers', label: 'Customers', badge: customers.length },
              { key: 'pending', label: 'Pending', badge: pending.length },
              { key: 'team', label: 'Team', badge: team.length },
            ]}
            active={tab}
            onChange={(k) => setTab(k as 'customers' | 'pending' | 'team')}
          />
        </div>
        <div className="p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shown.map((u) => (
              <div key={u.id} className="rounded-xl border border-gray-100 p-3.5">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[13px] font-bold shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                    {String(u.name || u.email).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-gray-900 truncate">{u.name || '—'}</div>
                    <div className="text-[11px] text-gray-500 truncate">{u.email}</div>
                  </div>
                  {u.isBlocked && <Badge tone="red">blocked</Badge>}
                  {u.verified === false && <Badge tone="amber">pending</Badge>}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">Joined {formatDate(u.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {u.verified === false && <Button onClick={() => save({ ...u, verified: true })}>Approve</Button>}
                    <Toggle on={!u.isBlocked} onChange={(v) => save({ ...u, isBlocked: !v })} label={u.isBlocked ? 'Blocked' : 'Active'} />
                  </div>
                </div>
              </div>
            ))}
            {!shown.length && (
              <EmptyState
                title={tab === 'pending' ? 'Nothing waiting for approval' : 'Nobody here yet'}
                hint={tab === 'pending' ? 'Accounts created at /account land here for approval.' : 'Add a user to get started.'}
                icon={<UsersIcon size={16} />}
              />
            )}
          </div>
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add user">
        <div className="space-y-3">
          <Field label="Name"><input className={INPUT_CLS} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          <Field label="Email"><input className={INPUT_CLS} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
          <p className="text-[11px] text-gray-500">
            Created approved. The customer sets their own password by signing up at /account with this email.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!draft.email.trim()) return;
                save({
                  id: `user_${crypto.randomUUID()}`,
                  name: draft.name || undefined,
                  // Lowercase: /account matches the email exactly when it claims this row.
                  email: draft.email.trim().toLowerCase(),
                  role: 'buyer',
                  verified: true,
                  createdAt: new Date().toISOString(),
                });
                setDraft({ name: '', email: '' });
                setAddOpen(false);
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function ReviewsView() {
  const { rows, source, error, save, remove } = useAdminTable<AdminReview>('product_reviews', adminReviews);
  const [status, setStatus] = useState<'all' | AdminReview['status']>('pending');
  const [rejecting, setRejecting] = useState<AdminReview | null>(null);
  const [reason, setReason] = useState('');

  const shown = status === 'all' ? rows : rows.filter((r) => r.status === status);
  const approved = rows.filter((r) => r.status === 'approved');
  const aggregate = aggregateApprovedReviews(rows);

  const decide = (review: AdminReview, next: AdminReview['status'], rejectionReason?: string) =>
    save({ ...review, status: next, rejectionReason, moderatedAt: new Date().toISOString(), moderatedBy: 'preview@bascosports.com' });

  return (
    <div className="space-y-4">
      <PageHeader title="Reviews" subtitle="Moderation queue — only approved reviews feed a product's public rating." />
      <DataNotice source={source} error={error} />

      <StatGrid cols={4}>
        <StatCard label="Pending" value={rows.filter((r) => r.status === 'pending').length} hint="waiting on a decision" icon={<WarningCircle size={15} weight="bold" />} tone="amber" />
        <StatCard label="Approved" value={approved.length} hint="published with verified badges" icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Rejected" value={rows.filter((r) => r.status === 'rejected').length} hint="kept for the audit trail" icon={<Prohibit size={15} weight="bold" />} tone="rose" />
        <StatCard label="Average rating" value={aggregate.rating} hint={`${aggregate.reviewCount} approved reviews`} icon={<Star size={15} weight="bold" />} tone="violet" />
      </StatGrid>

      <Card bodyClass="p-0">
        <div className="px-3">
          <Tabs
            tabs={[
              { key: 'pending', label: 'Pending', badge: rows.filter((r) => r.status === 'pending').length },
              { key: 'approved', label: 'Approved', badge: rows.filter((r) => r.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', badge: rows.filter((r) => r.status === 'rejected').length },
              { key: 'all', label: 'All', badge: rows.length },
            ]}
            active={status}
            onChange={(k) => setStatus(k as AdminReview['status'] | 'all')}
          />
        </div>
        <div className="p-4 space-y-3">
          {shown.length === 0 && <EmptyState title="Nothing in this queue" hint="Switch tabs to see other reviews." icon={<Star size={16} />} />}
          {shown.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-gray-900">{r.title || 'Untitled review'}</span>
                    <span className="text-amber-500 text-[12px]" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}<span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span></span>
                    {r.verifiedPurchase && <Badge tone="green">verified purchase</Badge>}
                    <Badge tone={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'amber'}>{r.status}</Badge>
                  </div>
                  <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed">{r.body}</p>
                  <div className="mt-2 text-[11px] text-gray-400">
                    {r.authorName} · {formatDate(r.createdAt)}
                    {r.orderNumber && <> · order {r.orderNumber}</>}
                    {r.productSlug && <> · <Link href={`/product/${r.productSlug}`} className="text-blue-600 hover:underline">{r.productName}</Link></>}
                  </div>
                  {r.rejectionReason && <div className="mt-2 text-[11px] text-rose-600">Rejected: {r.rejectionReason}</div>}
                </div>
                <div className="flex items-center gap-1.5">
                  {r.status !== 'approved' && <Button variant="secondary" className="h-9 px-3" onClick={() => decide(r, 'approved')}><CheckCircle size={13} weight="bold" /> Approve</Button>}
                  {r.status !== 'rejected' && (
                    <Button variant="danger" className="h-9 px-3" onClick={() => { setRejecting(r); setReason(''); }}>
                      <Prohibit size={13} weight="bold" /> Reject
                    </Button>
                  )}
                  <Button variant="ghost" className="h-9 px-3" onClick={() => remove(r.id)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject review">
        <div className="space-y-3">
          <Field label="Reason" hint="Stored with the review so the decision is auditable.">
            <textarea rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px]" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (rejecting) decide(rejecting, 'rejected', reason || 'No reason given');
                setRejecting(null);
              }}
            >
              Reject review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gift Drop
// ---------------------------------------------------------------------------

export function GiftDropView() {
  const [config, setConfig] = useState(giftDrop);

  return (
    <div className="space-y-4">
      <PageHeader title="Gift Drop" subtitle="Genuine $0 giveaways with a real claims ledger and per-day caps." actions={<Toggle on={config.active} onChange={(v) => setConfig({ ...config, active: v })} label={config.active ? 'Campaign live' : 'Paused'} />} />
      <DemoNotice />

      <StatGrid cols={4}>
        <StatCard label="Claims today" value={config.claimsToday} hint={`cap ${config.perDayCap} per day`} icon={<Gift size={15} weight="bold" />} tone="amber" />
        <StatCard label="Claimed total" value={config.claimed} hint={`of ${config.total} allocated`} icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Remaining" value={config.total - config.claimed} hint="until the drop closes" icon={<Gift size={15} weight="bold" />} tone="violet" />
        <StatCard label="Eligible products" value={config.productNames.length} hint="set per product" icon={<ShoppingCart size={15} weight="bold" />} tone="blue" />
      </StatGrid>

      <Card title="Campaign configuration">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Total allocation"><input type="number" className={INPUT_CLS} value={config.total} onChange={(e) => setConfig({ ...config, total: Number(e.target.value) })} /></Field>
          <Field label="Per-day cap"><input type="number" className={INPUT_CLS} value={config.perDayCap} onChange={(e) => setConfig({ ...config, perDayCap: Number(e.target.value) })} /></Field>
          <Field label="Claims today"><input type="number" className={INPUT_CLS} value={config.claimsToday} onChange={(e) => setConfig({ ...config, claimsToday: Number(e.target.value) })} /></Field>
        </div>
        <div className="mt-4">
          <ProgressBar value={(config.claimed / config.total) * 100} tone="emerald" />
          <p className="mt-2 text-[11px] text-gray-500">{config.claimed} of {config.total} claimed ({Math.round((config.claimed / config.total) * 100)}%)</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {config.productNames.map((n) => <Badge key={n} tone="violet">{n}</Badge>)}
        </div>
      </Card>

      <Card title="Claims ledger" bodyClass="p-0">
        <div className="divide-y divide-gray-50">
          {giftDropClaims.map((c) => (
            <div key={c.id} className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[11px] text-gray-500">{c.orderNumber}</span>
              <span className="text-[12px] text-gray-800 flex-1 min-w-[10rem]">{c.customerName}</span>
              <span className="text-[11px] text-gray-500 truncate max-w-[16rem]">{c.productName}</span>
              <span className="text-[11px] text-gray-400">{formatDate(c.claimedAt)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export function CampaignsView() {
  const { rows, save, remove } = useAdminTable<DemoCampaign>('campaigns', campaigns);
  const { rows: products } = useAdminTable<AdminProduct>('products', catalogSeed);
  const [editing, setEditing] = useState<DemoCampaign | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campaigns"
        subtitle="Multi-campaign manager with gift-eligible products and per-product discount caps."
        actions={<Button onClick={() => setEditing({ id: `cmp-${Date.now()}`, name: '', slug: '', status: 'scheduled', discountCap: 15, products: 0, claimsToday: 0, claimsTotal: 0, startsAt: new Date().toISOString(), endsAt: new Date().toISOString() })}><Plus size={14} weight="bold" /> New campaign</Button>}
      />
      <DemoNotice />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-gray-900 truncate">{c.name || 'Untitled campaign'}</div>
                <div className="text-[11px] text-gray-400">/{c.slug || 'slug'}</div>
              </div>
              <Badge tone={c.status === 'active' ? 'green' : c.status === 'scheduled' ? 'blue' : 'gray'}>{c.status}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Products', value: c.products },
                { label: 'Claims today', value: c.claimsToday },
                { label: 'Total claims', value: c.claimsTotal },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-gray-50 py-2">
                  <div className="text-[15px] font-bold text-gray-900">{s.value}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
              <span>Cap {c.discountCap}% per product</span>
              <span>{formatDate(c.startsAt)} → {formatDate(c.endsAt)}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="secondary" className="h-9 px-3" onClick={() => setEditing(c)}>Edit</Button>
              <Button variant="ghost" className="h-9 px-3" onClick={() => remove(c.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Gift-eligible products" actions={<Megaphone size={15} className="text-gray-300" />}>
        <div className="flex flex-wrap gap-1.5">
          {products.filter((p) => p.isActive).slice(0, 12).map((p) => <Badge key={p.id} tone="blue">{p.name}</Badge>)}
        </div>
        <p className="mt-3 text-[11px] text-gray-500">Eligibility is set per product on the Promotions tab of the product editor.</p>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.name ? 'Edit campaign' : 'New campaign'}>
        {editing && (
          <div className="space-y-3">
            <Field label="Campaign name"><input className={INPUT_CLS} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Slug"><input className={INPUT_CLS} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Discount cap (%)"><input type="number" className={INPUT_CLS} value={editing.discountCap} onChange={(e) => setEditing({ ...editing, discountCap: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Status">
              <select className={SELECT_CLS + ' w-full'} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as DemoCampaign['status'] })}>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="ended">Ended</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={async () => { if (await save(editing)) setEditing(null); }}>Save campaign</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
