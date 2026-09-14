'use client';

import { ReactNode, useMemo, useState } from 'react';
import { CaretUpDown, CaretUp, CaretDown } from '@phosphor-icons/react';
import { EmptyState, Pagination } from './ui';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. Receives the row so cells stay dumb. */
  cell: (row: T) => ReactNode;
  /** Value used for search + sorting. Return a string/number; omit to make the column unsortable. */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: string;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  search,
  searchPlaceholder,
  filters,
  actions,
  empty,
  perPage = 10,
  onRowClick,
  rowActions,
  dense,
}: {
  rows: T[];
  columns: Column<T>[];
  search?: string;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  empty?: { title: string; hint?: string; icon?: ReactNode };
  perPage?: number;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  dense?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.sortValue ? c.sortValue(r) : '';
        return String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, columns, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pages - 1);
  const slice = sorted.slice(safePage * perPage, safePage * perPage + perPage);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {(search !== undefined || filters || actions) && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          {actions}
          <div className="flex-1" />
          {filters}
        </div>
      )}

      {slice.length === 0 ? (
        <EmptyState icon={empty?.icon} title={empty?.title || 'Nothing here yet'} hint={empty?.hint} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {columns.map((c) => {
                  const on = sortKey === c.key;
                  const sortable = !!c.sortValue;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      className={`px-4 ${dense ? 'py-2' : 'py-2.5'} text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={`inline-flex items-center gap-1 hover:text-gray-800 ${on ? 'text-gray-800' : ''}`}
                        >
                          {c.header}
                          {on ? (sortDir === 'asc' ? <CaretUp size={9} weight="bold" /> : <CaretDown size={9} weight="bold" />) : <CaretUpDown size={9} />}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
                {rowActions && <th scope="col" className="px-4 py-2.5 w-px" />}
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-gray-50 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-gray-50/70' : ''}`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 ${dense ? 'py-2' : 'py-2.5'} text-[12px] text-gray-700 align-middle ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''} ${c.className || ''}`}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-2 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-gray-100">
        <Pagination page={safePage} pages={pages} total={sorted.length} onPage={setPage} perPage={perPage} />
      </div>
    </div>
  );
}
