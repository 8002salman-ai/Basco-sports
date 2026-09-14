import Link from 'next/link';
import { cookies } from 'next/headers';
import AccountAuth from '@/components/account/AccountAuth';
import PasswordChangePanel from '@/components/account/PasswordChangePanel';
import WishlistPanel from '@/components/account/WishlistPanel';
import { CUSTOMER_SESSION_COOKIE, getCustomerAccount, verifyCustomerSession } from '@/lib/customer-auth';
import { listCustomerOrders } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  shipped: 'Shipped',
  delivered: 'Delivered',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_TONE: Record<string, string> = {
  paid: 'bg-lime/30 text-obsidian',
  shipped: 'bg-obsidian text-white',
  delivered: 'bg-obsidian/10 text-obsidian',
  refunded: 'bg-stone-200 text-obsidian/60',
  cancelled: 'bg-sale-light text-sale',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AccountPage() {
  const token = cookies().get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = token ? await verifyCustomerSession(token) : null;

  if (!session) return <AccountAuth />;

  // Signup is open, and orders are linked to a customer by email alone, so only
  // an approved account is served order data.
  const account = await getCustomerAccount(session.userId);
  const approved = account?.verified === true;
  const orders = approved ? await listCustomerOrders(session.email) : [];

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] opacity-50">Your account</div>
          <h1 className="mt-2 font-display text-[30px] lg:text-[38px] leading-none">
            Hello, {session.name || session.email.split('@')[0]}
          </h1>
          <p className="mt-2 text-[13px] text-obsidian/60">{session.email}</p>
        </div>
        <form action="/api/account/logout" method="post">
          <button
            type="submit"
            className="h-11 px-6 rounded-full border border-stone-300 text-[14px] font-medium hover:bg-obsidian hover:text-white hover:border-obsidian transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian"
          >
            Sign out
          </button>
        </form>
      </div>

      <section aria-labelledby="orders-heading" className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 id="orders-heading" className="font-display text-[20px]">
            Orders
          </h2>
          {orders.length > 0 && <span className="text-[12px] text-obsidian/50">{orders.length} total</span>}
        </div>

        {!approved ? (
          <div className="mt-4 bg-white rounded-[20px] border border-stone-200 p-6">
            <p className="text-[14px] text-obsidian/70">Your account is waiting for approval.</p>
            <p className="mt-1 text-[13px] text-obsidian/50">
              A store admin reviews new accounts. Once yours is approved, orders placed with {session.email} appear
              here with their status and tracking.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-obsidian px-6 text-[14px] font-semibold text-white hover:bg-obsidian-600 transition-colors"
            >
              Contact support
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-4 bg-white rounded-[20px] border border-stone-200 p-6">
            <p className="text-[14px] text-obsidian/70">No orders yet.</p>
            <p className="mt-1 text-[13px] text-obsidian/50">
              Orders placed with {session.email} appear here with their status and tracking.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-obsidian px-6 text-[14px] font-semibold text-white hover:bg-obsidian-600 transition-colors"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {orders.map((order) => (
              <li key={order.orderNumber} className="bg-white rounded-[20px] border border-stone-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[16px]">{order.orderNumber}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                        STATUS_TONE[order.status] || 'bg-stone-200 text-obsidian/60'
                      }`}
                    >
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                  <div className="text-[12px] text-obsidian/50">{formatDate(order.createdAt)}</div>
                </div>

                <ul className="mt-4 divide-y divide-stone-200 border-t border-stone-200">
                  {(order.items || []).map((item, index) => (
                    <li key={`${order.orderNumber}-${index}`} className="flex items-start justify-between gap-4 py-3">
                      <div>
                        <div className="text-[14px]">{item.name}</div>
                        <div className="text-[12px] text-obsidian/50">
                          Qty {item.quantity}
                          {item.variantLabel ? ` · ${item.variantLabel}` : ''}
                        </div>
                      </div>
                      <div className="text-[14px] tabular-nums">{formatPrice(item.price * item.quantity, order.currency)}</div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
                  <span className="text-[13px] text-obsidian/60">
                    {order.coupon ? `Coupon ${order.coupon} applied` : 'Total'}
                  </span>
                  <span className="font-display text-[18px]">{formatPrice(order.total, order.currency)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="settings-heading" className="mt-10">
        <h2 id="settings-heading" className="font-display text-[20px]">
          Settings
        </h2>
        <div className="mt-4 bg-white rounded-[20px] border border-stone-200 p-6">
          <h3 className="text-[14px] font-medium text-obsidian/80">Change password</h3>
          <p className="mt-1 text-[13px] text-obsidian/50">
            Updating your password will sign you out of all other devices.
          </p>
          <PasswordChangePanel />
        </div>
      </section>

      <WishlistPanel />
    </main>
  );
}
