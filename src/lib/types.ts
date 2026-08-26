export type CategorySlug = 'football' | 'cricket' | 'basketball' | 'running' | 'gym' | 'outdoor' | 'accessories' | 'deals';

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
  color: string;
}

export type ProductBadge = 'NEW' | 'SALE' | 'BESTSELLER' | 'LIMITED';

export interface ProductVariant {
  color: string;
  colorHex: string;
  sizes?: string[];
  images: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  categories: CategorySlug[];
  price: number;
  compareAtPrice?: number;
  badges?: ProductBadge[];
  rating: number;
  reviewCount: number;
  stock: number;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  variants: ProductVariant[];
  defaultVariantIndex: number;
  images: string[];
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
}

export interface CartItem {
  productId: string;
  variantIndex: number;
  color: string;
  size?: string;
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minSubtotal?: number;
  description: string;
}

export interface JournalPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
  content: string;
}
