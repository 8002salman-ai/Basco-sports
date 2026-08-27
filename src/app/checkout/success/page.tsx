import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

/**
 * Checkout success page – shown after Stripe redirects back.
 * The actual order confirmation is handled by the webhook
 * (which runs server-side and saves to DB).
 */

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-lime mx-auto flex items-center justify-center">
        <ShieldCheck className="w-10 h-10" />
      </div>
      <h1 className="mt-6 font-display text-[36px] leading-none">Order confirmed!</h1>
      <p className="mt-4 text-obsidian/70 max-w-[480px] mx-auto">
        Thank you for your purchase! Your payment was processed successfully.
        {session_id && (
          <span className="block mt-2 text-[12px] text-obsidian/40 font-mono">
            Session: {session_id.slice(0, 20)}…
          </span>
        )}
      </p>

      <div className="mt-8 p-6 rounded-[20px] bg-white border text-left text-[13px] leading-relaxed">
        <div className="font-semibold">What happens next:</div>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-obsidian/70">
          <li>Order confirmation email sent to your inbox</li>
          <li>Order is being prepared for shipment</li>
          <li>You&apos;ll receive tracking info once shipped</li>
        </ul>
      </div>

      <div className="mt-8 flex gap-4 justify-center">
        <Link
          href="/shop"
          className="inline-flex h-12 px-8 rounded-full bg-obsidian text-white font-semibold items-center"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 px-8 rounded-full border border-stone-200 font-semibold items-center"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
