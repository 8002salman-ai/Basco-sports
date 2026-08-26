'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { getDb } from '@/lib/admin/db';
import { AdminProduct } from '@/lib/admin/types';
import { products as seedProducts } from '@/data/products';
import { DbStatus } from './DbStatus';

const SEED_FLAG = 'basco_admin_v1:seeded';

interface ProductForm {
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  description: string;
  features: string;
  image: string;
  isActive: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  slug: '',
  brand: 'Basco Equipment',
  category: 'football',
  price: '',
  compareAtPrice: '',
  stock: '0',
  description: '',
  features: '',
  image: '',
  isActive: true,
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CatalogPanel() {
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const db = useMemo(() => getDb(), []);

  const load = useCallback(async () => {
    try {
      const existing = await db.list<AdminProduct>('products', { orderBy: 'updatedAt desc' });
      if (existing.length === 0) {
        let seeded = false;
        try {
          seeded = window.localStorage.getItem(SEED_FLAG) === '1';
        } catch {
          /* ignore */
        }
        if (!seeded) {
          const now = new Date().toISOString();
          const seed: AdminProduct[] = seedProducts.map((p) => ({
            ...p,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          }));
          for (const p of seed) await db.insert('products', p);
          try {
            window.localStorage.setItem(SEED_FLAG, '1');
          } catch {
            /* ignore */
          }
          setRows(seed);
          setLoading(false);
          return;
        }
        setRows([]);
      } else {
        setRows(existing);
      }
      setLoading(false);
    } catch (e) {
      setError((e as Error).message || 'Failed to load catalog');
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setSavedMsg(msg);
    window.setTimeout(() => setSavedMsg(null), 2500);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.slug.includes(q) || p.brand.toLowerCase().includes(q);
    });
  }, [rows, query, category]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setCreating(false);
    setForm({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      stock: String(p.stock),
      description: p.description,
      features: p.features.join(', '),
      image: p.images[0] || '',
      isActive: p.isActive,
    });
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const price = Number(form.price);
      const compareAtPrice = form.compareAtPrice ? Number(form.compareAtPrice) : undefined;
      const stock = Number(form.stock) || 0;
      const features = form.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
      const image = form.image.trim();
      const now = new Date().toISOString();
      const slug = form.slug.trim() ? slugify(form.slug) : slugify(form.name);

      if (creating) {
        const product: AdminProduct = {
          id: `p-${Date.now()}`,
          slug,
          name: form.name.trim(),
          brand: form.brand.trim() || 'Basco Equipment',
          category: form.category as AdminProduct['category'],
          categories: [form.category as AdminProduct['category']],
          price,
          compareAtPrice,
          rating: 0,
          reviewCount: 0,
          stock,
          description: form.description.trim(),
          features,
          specifications: {},
          variants: [{ color: 'Default', colorHex: '#0B1220', images: image ? [image] : [] }],
          defaultVariantIndex: 0,
          images: image ? [image] : [],
          isActive: form.isActive,
          createdAt: now,
          updatedAt: now,
        };
        await db.insert('products', product);
        flash('Product created');
      } else if (editing) {
        const patch: Partial<AdminProduct> = {
          slug,
          name: form.name.trim(),
          brand: form.brand.trim() || 'Basco Equipment',
          category: form.category as AdminProduct['category'],
          categories: [form.category as AdminProduct['category']],
          price,
          compareAtPrice,
          stock,
          description: form.description.trim(),
          features,
          images: image ? [image] : editing.images,
          variants: [{ color: 'Default', colorHex: '#0B1220', images: image ? [image] : editing.images }],
          isActive: form.isActive,
          updatedAt: now,
        };
        await db.update('products', editing.id, patch);
        flash('Product updated');
      }
      setCreating(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError((e as Error).message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: AdminProduct) => {
    await db.update<AdminProduct>('products', p.id, { isActive: !p.isActive, updatedAt: new Date().toISOString() });
    await load();
  };

  const remove = async (p: AdminProduct) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await db.remove('products', p.id);
    await load();
    flash('Product deleted');
  };

  const categories = useMemo(() => {
    const set = new Set<string>(['all']);
    rows.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [rows]);

  if (loading) {
    return <div className="py-20 text-center text-[14px] text-obsidian/50">Loading catalog…</div>;
  }

  const inputCls =
    'w-full h-10 px-3 rounded-[10px] border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-lime-300';

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Catalog</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60 flex items-center gap-2">
            <DbStatus /> {rows.length} products
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-obsidian text-white text-[13px] font-medium"
        >
          <Plus size={15} /> Add product
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">{error}</div>
      )}
      {savedMsg && (
        <div className="mt-4 rounded-[12px] bg-emerald-50 border border-emerald-200 p-3 text-[13px] text-emerald-700">
          {savedMsg}
        </div>
      )}

      <div className="mt-6 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className={`${inputCls} pl-9`} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} w-auto`}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 bg-white rounded-[16px] border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-obsidian/50">No products match.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-stone-50 text-[11px] tracking-wider uppercase text-obsidian/50">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-stone-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-[10px] object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-[10px] bg-stone-100" />
                      )}
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate max-w-[280px]">{p.name}</div>
                        <div className="text-[11px] text-obsidian/50">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] capitalize hidden md:table-cell">{p.category}</td>
                  <td className="px-4 py-3 text-[13px]">
                    ${p.price.toFixed(2)}
                    {p.compareAtPrice ? <span className="ml-1.5 text-[11px] text-obsidian/40 line-through">${p.compareAtPrice.toFixed(2)}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-[13px] hidden sm:table-cell">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border text-[11px]">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(p)}
                        title={p.isActive ? 'Hide' : 'Show'}
                        className="p-2 rounded-[8px] hover:bg-stone-100 text-obsidian/60"
                      >
                        {p.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => openEdit(p)} title="Edit" className="p-2 rounded-[8px] hover:bg-stone-100 text-obsidian/60">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(p)} title="Delete" className="p-2 rounded-[8px] hover:bg-red-50 text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 bg-obsidian/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <div className="bg-white rounded-[20px] w-full max-w-2xl my-4 p-6">
            <h2 className="font-display text-[22px]">{creating ? 'Add product' : `Edit: ${editing?.name}`}</h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputCls} mt-1`} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-name" className={`${inputCls} mt-1`} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Brand</label>
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={`${inputCls} mt-1`} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputCls} mt-1`}>
                  {['football', 'cricket', 'basketball', 'running', 'gym', 'outdoor', 'accessories'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Price ($)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={`${inputCls} mt-1`} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Compare at ($)</label>
                  <input type="number" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className={`${inputCls} mt-1`} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Stock</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={`${inputCls} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Image URL (Unsplash etc.)</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={`${inputCls} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} h-auto py-2 mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-obsidian/50">Features (comma separated)</label>
                <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className={`${inputCls} mt-1`} />
              </div>
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-lime-400" />
                Active (visible in storefront)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                className="h-10 px-5 rounded-full border text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name.trim() || !form.price}
                className="h-10 px-5 rounded-full bg-obsidian text-white text-[13px] font-medium disabled:opacity-50"
              >
                {saving ? 'Saving…' : creating ? 'Create product' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
