/**
 * Basco Sports – Admin panel types (data layer rows)
 * Mirrors the Luxedge admin data model, adapted to Basco's product shape.
 */

import type { Product } from '@/lib/types';

/** Product row in admin storage – Product plus admin-only flags. */
export interface AdminProduct extends Product {
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface AdminOrderItem {
  id: string;
  name: string;
  variantLabel?: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  items: AdminOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  coupon?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminUserRole = 'admin' | 'buyer';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: AdminUserRole;
  isBlocked?: boolean;
  createdAt: string;
}

export interface StoreSettings {
  key: string;
  storeName: string;
  supportEmail: string;
  currency: string;
  announcement?: string;
  paymentProvider: string;
  updatedAt: string;
}

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
