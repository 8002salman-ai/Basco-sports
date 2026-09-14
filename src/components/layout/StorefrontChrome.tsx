'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Storefront chrome (announcement bar, header, cart, footer) wraps every page
 * except the admin console — `/admin` is a standalone operations console with
 * its own shell, so the shop header/footer must not frame it.
 *
 * The chrome nodes are rendered on the server and passed through as children,
 * so this stays a thin client-side switch with no extra re-rendering.
 */
export function StorefrontChrome({
  announcement,
  header,
  cartDrawer,
  footer,
  children,
}: {
  announcement: ReactNode;
  header: ReactNode;
  cartDrawer: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname?.startsWith('/admin/');

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {announcement}
      {header}
      {cartDrawer}
      {children}
      {footer}
    </>
  );
}
