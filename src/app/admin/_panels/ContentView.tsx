'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  FileText, Plus, Eye, Trash, YoutubeLogo, ArrowsClockwise, Sparkle, CheckCircle, WarningCircle, PencilSimple,
} from '@phosphor-icons/react';
import {
  Badge, Button, Card, DemoNotice, Drawer, EmptyState, Field, INPUT_CLS, KeyValue,
  Modal, Notice, PageHeader, SELECT_CLS, StatCard, StatGrid, Tabs, TEXTAREA_CLS, Toolbar,
} from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import { adminPosts, adminVideos, formatDate, type AdminPost, type AdminVideo, type PostStatus } from '@/features/admin/demo/data';
import { useAdminTable } from '@/hooks/use-admin-table';

export function BlogsView() {
  const { rows, save: upsert, remove } = useAdminTable<AdminPost>('posts', adminPosts);
  const [status, setStatus] = useState<'all' | PostStatus>('all');
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [seoNotice, setSeoNotice] = useState<string | null>(null);

  const shown = status === 'all' ? rows : rows.filter((p) => p.status === status);
  const incomplete = rows.filter((p) => !p.seoComplete);

  const emptyDraft = (): AdminPost => ({
    id: `post-${Date.now()}`,
    slug: '',
    title: '',
    excerpt: '',
    category: 'Football',
    image: '',
    status: 'draft',
    views: 0,
    readTime: '5 min',
    author: 'Basco Editorial',
    tags: [],
    seoComplete: false,
    updatedAt: new Date().toISOString(),
  });

  const columns: Column<AdminPost>[] = [
    {
      key: 'post',
      header: 'Post',
      cell: (p) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {p.image ? <Image src={p.image} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" /> : <span className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />}
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate max-w-[260px]">{p.title || 'Untitled'}</div>
            <div className="text-[10px] text-gray-400">/{p.slug || 'slug'} · {p.category}</div>
          </div>
        </div>
      ),
      sortValue: (p) => p.title,
    },
    { key: 'status', header: 'Status', cell: (p) => <Badge tone={p.status === 'published' ? 'green' : p.status === 'scheduled' ? 'blue' : 'gray'}>{p.status}</Badge>, sortValue: (p) => p.status },
    { key: 'views', header: 'Views', align: 'right', cell: (p) => <span className="text-gray-600">{p.views.toLocaleString('en-US')}</span>, sortValue: (p) => p.views },
    { key: 'seo', header: 'SEO', cell: (p) => <Badge tone={p.seoComplete ? 'green' : 'amber'}>{p.seoComplete ? 'complete' : 'incomplete'}</Badge>, sortValue: (p) => (p.seoComplete ? 1 : 0) },
    { key: 'author', header: 'Author', cell: (p) => <span className="text-gray-600">{p.author}</span>, sortValue: (p) => p.author },
    { key: 'updated', header: 'Updated', cell: (p) => <span className="text-gray-500">{formatDate(p.updatedAt)}</span>, sortValue: (p) => p.updatedAt },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Blog Posts"
        subtitle="Content source of truth with draft / publish / schedule states."
        actions={
          <>
            <Button
              variant="secondary"
              disabled={!incomplete.length}
              onClick={() => {
                incomplete.forEach((p) => upsert({ ...p, seoComplete: true, updatedAt: new Date().toISOString() }));
                setSeoNotice(`Filled meta title, description and keywords for ${incomplete.length} post${incomplete.length === 1 ? '' : 's'} that were missing them. Complete SEO is never overwritten.`);
              }}
            >
              <Sparkle size={14} weight="bold" /> Generate missing SEO
            </Button>
            <Button onClick={() => setEditing(emptyDraft())}><Plus size={14} weight="bold" /> New post</Button>
          </>
        }
      />
      <DemoNotice />

      <StatGrid cols={4}>
        <StatCard label="Posts" value={rows.length} hint="all states" icon={<FileText size={15} weight="bold" />} tone="blue" />
        <StatCard label="Published" value={rows.filter((p) => p.status === 'published').length} hint="live on the storefront" icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Queued" value={rows.filter((p) => p.status !== 'published').length} hint="draft or scheduled" icon={<WarningCircle size={15} weight="bold" />} tone="amber" />
        <StatCard label="Total views" value={rows.reduce((a, p) => a + p.views, 0).toLocaleString('en-US')} hint="first-party counter" icon={<Eye size={15} weight="bold" />} tone="violet" />
      </StatGrid>

      {seoNotice && <Notice tone="green">{seoNotice} <button type="button" className="underline font-semibold" onClick={() => setSeoNotice(null)}>Dismiss</button></Notice>}

      <Card>
        <div className="px-3">
          <Tabs
            tabs={['all', 'published', 'draft', 'scheduled'].map((s) => ({ key: s, label: s, badge: s === 'all' ? rows.length : rows.filter((p) => p.status === s).length }))}
            active={status}
            onChange={(k) => setStatus(k as PostStatus | 'all')}
          />
        </div>
        <div className="p-4">
          <DataTable
            rows={shown}
            columns={columns}
            perPage={8}
            empty={{ title: 'No posts in this state', hint: 'Create a post to start the content queue.', icon: <FileText size={16} /> }}
            rowActions={(p) => (
              <div className="flex items-center justify-end gap-1">
                <button type="button" onClick={() => setEditing(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`Edit ${p.title}`} title="Edit"><PencilSimple size={14} /></button>
                {p.status === 'published' ? (
                  <button type="button" onClick={() => upsert({ ...p, status: 'draft', updatedAt: new Date().toISOString() })} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50" aria-label={`Unpublish ${p.title}`} title="Unpublish"><WarningCircle size={14} /></button>
                ) : (
                  <button type="button" onClick={() => upsert({ ...p, status: 'published', updatedAt: new Date().toISOString() })} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" aria-label={`Publish ${p.title}`} title="Publish"><CheckCircle size={14} /></button>
                )}
                <Link href={`/journal/${p.slug}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`Preview ${p.title}`} title="Preview on storefront"><Eye size={14} /></Link>
                <button type="button" onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${p.title}`} title="Delete"><Trash size={14} /></button>
              </div>
            )}
          />
        </div>
      </Card>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.title ? 'Edit post' : 'New post'}
        width="max-w-2xl"
        footer={
          editing && (
            <>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => { upsert({ ...editing, slug: editing.slug || editing.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), updatedAt: new Date().toISOString() }); setEditing(null); }}>
                {editing.status === 'published' ? 'Save & keep published' : 'Save post'}
              </Button>
            </>
          )
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Title" required><input className={INPUT_CLS} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Slug"><input className={INPUT_CLS} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Category"><input className={INPUT_CLS} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></Field>
            </div>
            <Field label="Excerpt"><textarea rows={3} className={TEXTAREA_CLS} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></Field>
            <Field label="Body" hint="Plain text in the clone; the real editor stores rich content.">
              <textarea rows={8} className={TEXTAREA_CLS} defaultValue={editing.excerpt} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Status">
                <select className={SELECT_CLS + ' w-full'} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as PostStatus })}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <Field label="Tags" hint="Comma separated.">
                <input className={INPUT_CLS} value={editing.tags.join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
              </Field>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media Hub
// ---------------------------------------------------------------------------

export function MediaView() {
  const { rows, save: upsert, remove } = useAdminTable<AdminVideo>('videos', adminVideos);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AdminVideo | null>(null);
  const [syncNotice, setSyncNotice] = useState(false);

  const lastSync = useMemo(() => rows.reduce((acc, v) => (v.syncedAt > acc ? v.syncedAt : acc), rows[0]?.syncedAt || ''), [rows]);

  const columns: Column<AdminVideo>[] = [
    { key: 'title', header: 'Video', cell: (v) => <div className="min-w-0"><div className="font-medium text-gray-900 truncate max-w-[280px]">{v.title}</div><div className="text-[10px] text-gray-400 font-mono">{v.youtubeId}</div></div>, sortValue: (v) => v.title },
    { key: 'status', header: 'Status', cell: (v) => <Badge tone={v.status === 'published' ? 'green' : 'gray'}>{v.status}</Badge>, sortValue: (v) => v.status },
    { key: 'duration', header: 'Duration', cell: (v) => <span className="text-gray-600 font-mono text-[11px]">{v.duration}</span>, sortValue: (v) => v.duration },
    { key: 'tags', header: 'Tags', cell: (v) => <div className="flex flex-wrap gap-1">{v.tags.slice(0, 2).map((t) => <Badge key={t} tone="blue">{t}</Badge>)}</div> },
    { key: 'views', header: 'Views', align: 'right', cell: (v) => <span className="text-gray-600">{v.views.toLocaleString('en-US')}</span>, sortValue: (v) => v.views },
    { key: 'synced', header: 'Synced', cell: (v) => <span className="text-gray-500">{formatDate(v.syncedAt)}</span>, sortValue: (v) => v.syncedAt },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Media Hub"
        subtitle="YouTube-centric catalogue with automatic import and a last-synced stamp."
        actions={
          <>
            <Button variant="secondary" onClick={() => setSyncNotice(true)}><ArrowsClockwise size={14} weight="bold" /> Sync YouTube</Button>
            <Button onClick={() => upsert({ id: `vid-${Date.now()}`, title: '', youtubeId: '', duration: 'PT0M0S', status: 'draft', tags: [], views: 0, relatedProductIds: [], syncedAt: new Date().toISOString() })}>
              <Plus size={14} weight="bold" /> Add video
            </Button>
          </>
        }
      />
      <DemoNotice />

      {syncNotice && (
        <Notice tone="blue">
          YouTube sync needs Basco’s own API key, so the clone does not call it. Last synced stamp: {lastSync ? formatDate(lastSync) : 'never'}.
          <button type="button" className="ml-2 underline font-semibold" onClick={() => setSyncNotice(false)}>Dismiss</button>
        </Notice>
      )}

      <StatGrid cols={4}>
        <StatCard label="Videos" value={rows.length} hint="in the media catalogue" icon={<YoutubeLogo size={15} weight="bold" />} tone="rose" />
        <StatCard label="Published" value={rows.filter((v) => v.status === 'published').length} hint="embedded on storefront pages" icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Total views" value={rows.reduce((a, v) => a + v.views, 0).toLocaleString('en-US')} hint="reported by the platform" icon={<Eye size={15} weight="bold" />} tone="blue" />
        <StatCard label="Last synced" value={lastSync ? formatDate(lastSync) : 'never'} hint="manual + automatic import" icon={<ArrowsClockwise size={15} weight="bold" />} tone="violet" />
      </StatGrid>

      <Card>
        <Toolbar className="mb-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, tag or video id…" aria-label="Search media" className="h-10 px-3 rounded-lg border border-gray-200 text-[13px] w-full sm:w-72" />
        </Toolbar>
        <DataTable
          rows={rows}
          columns={columns}
          search={search}
          perPage={8}
          empty={{ title: 'No videos yet', hint: 'Sync YouTube or add one manually.', icon: <YoutubeLogo size={16} /> }}
          rowActions={(v) => (
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={() => upsert({ ...v, status: v.status === 'published' ? 'draft' : 'published' })} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`Toggle ${v.title}`} title="Toggle published">{v.status === 'published' ? <WarningCircle size={14} /> : <CheckCircle size={14} />}</button>
              <button type="button" onClick={() => setConfirmDelete(v)} className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${v.title}`} title="Delete"><Trash size={14} /></button>
            </div>
          )}
        />
      </Card>

      <Card title="Related products" bodyClass="p-4">
        <div className="space-y-2">
          {rows.filter((v) => v.relatedProductIds.length).map((v) => (
            <div key={v.id} className="flex items-center gap-2 text-[12px]">
              <span className="text-gray-700 truncate max-w-[18rem]">{v.title}</span>
              <span className="text-gray-300">→</span>
              <span className="text-gray-500">{v.relatedProductIds.length} product link{v.relatedProductIds.length === 1 ? '' : 's'}</span>
            </div>
          ))}
          {!rows.some((v) => v.relatedProductIds.length) && <EmptyState title="No product links yet" hint="Link a video to a product to surface it on the product page." />}
        </div>
      </Card>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete video">
        <p className="text-[13px] text-gray-600">Delete <strong>{confirmDelete?.title}</strong>? Product links to this video are removed with it.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (confirmDelete) remove(confirmDelete.id); setConfirmDelete(null); }}>Delete video</Button>
        </div>
      </Modal>
    </div>
  );
}
