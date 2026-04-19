'use client';
// Ghazi OS — Legendary Edition
// ArchiveClient — تفاعل كامل: فلترة، استعادة، حذف، تبويب البراندات/العناصر

import { useState, useTransition } from 'react';
import { restoreArchiveItem, deleteArchiveItem, restoreArchivedBrand } from '@/lib/archive-actions';

interface ArchiveEntry {
  id: string;
  type: string;
  reason: string;
  archived_at: string;
  archived_month: number | null;
  archived_year: number | null;
  data: Record<string, unknown>;
}

interface Brand {
  id: string;
  name: string;
  color: string;
  icon: string;
  status: string;
}

interface Props {
  initialArchive: ArchiveEntry[];
  archivedBrands: Brand[];
  activeBrands: Brand[];
}

const TYPE_LABELS: Record<string, string> = {
  project: 'مشروع',
  task: 'مهمة',
  personal_task: 'مهمة شخصية',
  subtask: 'مهمة فرعية',
  decision: 'قرار',
};

const REASON_LABELS: Record<string, string> = {
  done: 'مكتمل',
  cancelled: 'ملغي',
  manual: 'يدوي',
  auto: 'تلقائي',
};

const REASON_COLORS: Record<string, string> = {
  done: '#22c55e',
  cancelled: '#ef4444',
  manual: '#888',
  auto: '#C9963B',
};

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ArchiveClient({ initialArchive, archivedBrands, activeBrands }: Props) {
  const [archive, setArchive] = useState<ArchiveEntry[]>(initialArchive);
  const [archivedBrandsList, setArchivedBrandsList] = useState<Brand[]>(archivedBrands);
  const [activeTab, setActiveTab] = useState<'items' | 'brands'>('items');
  const [filterType, setFilterType] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [isPending, startTransition] = useTransition();

  const allBrands = [...activeBrands, ...archivedBrandsList];

  const getBrand = (brandId: string) => allBrands.find((b) => b.id === brandId);

  const filtered = archive
    .filter((a) => {
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (filterBrand !== 'all' && (a.data.brandId as string) !== filterBrand) return false;
      if (filterReason !== 'all' && a.reason !== filterReason) return false;
      return true;
    })
    .sort((a, b) => new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime());

  const doneCount = archive.filter((a) => a.reason === 'done').length;
  const cancelCount = archive.filter((a) => a.reason === 'cancelled').length;

  function handleRestore(id: string) {
    startTransition(async () => {
      const res = await restoreArchiveItem(id);
      if (res.ok) {
        setArchive((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm('حذف نهائياً؟ لا يمكن التراجع.')) return;
    startTransition(async () => {
      const res = await deleteArchiveItem(id);
      if (res.ok) {
        setArchive((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  function handleRestoreBrand(brandId: string) {
    startTransition(async () => {
      const res = await restoreArchivedBrand(brandId);
      if (res.ok) {
        setArchivedBrandsList((prev) => prev.filter((b) => b.id !== brandId));
      }
    });
  }

  return (
    <div className="scr on" dir="rtl">
      {/* رأس الصفحة */}
      <div className="page-header">
        <h1 className="page-title">الأرشيف</h1>
        <p className="page-subtitle">العناصر والبراندات المؤرشفة</p>
      </div>

      {/* التبويبات */}
      <div className="tabs-row">
        <button
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          عناصر ({archive.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'brands' ? 'active' : ''}`}
          onClick={() => setActiveTab('brands')}
        >
          براندات ({archivedBrandsList.length})
        </button>
      </div>

      {/* تبويب البراندات */}
      {activeTab === 'brands' && (
        <div className="section-body">
          {archivedBrandsList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏷️</div>
              <div className="empty-title">لا توجد براندات مؤرشفة</div>
              <div className="empty-sub">البراندات المؤرشفة ستظهر هنا</div>
            </div>
          ) : (
            <div className="list-col">
              {archivedBrandsList.map((b) => (
                <div key={b.id} className="archive-card">
                  <span style={{ fontSize: 22 }}>{b.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="item-title">{b.name}</div>
                  </div>
                  <div className="brand-dot" style={{ background: b.color }} />
                  <button
                    className="btn-restore"
                    onClick={() => handleRestoreBrand(b.id)}
                    disabled={isPending}
                  >
                    ↩ استرجاع
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* تبويب العناصر */}
      {activeTab === 'items' && (
        <div className="section-body">
          {/* إحصاءات */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num gold">{archive.length}</div>
              <div className="stat-label">إجمالي الأرشيف</div>
            </div>
            <div className="stat-card">
              <div className="stat-num green">{doneCount}</div>
              <div className="stat-label">مكتملة</div>
            </div>
            <div className="stat-card">
              <div className="stat-num red">{cancelCount}</div>
              <div className="stat-label">ملغاة</div>
            </div>
          </div>

          {/* الفلاتر */}
          <div className="filters-row">
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">كل الأنواع</option>
              <option value="project">مشاريع</option>
              <option value="task">مهام عامة</option>
              <option value="personal_task">مهام شخصية</option>
              <option value="decision">قرارات</option>
            </select>
            <select
              className="filter-select"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
            >
              <option value="all">كل البراندات</option>
              {activeBrands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
            >
              <option value="all">كل الأسباب</option>
              <option value="done">مكتمل</option>
              <option value="cancelled">ملغي</option>
              <option value="manual">يدوي</option>
            </select>
          </div>

          {/* القائمة */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗄️</div>
              <div className="empty-title">الأرشيف فارغ</div>
              <div className="empty-sub">العناصر المؤرشفة ستظهر هنا</div>
            </div>
          ) : (
            <div className="list-col">
              {filtered.map((a) => {
                const b = getBrand((a.data.brandId as string) ?? '');
                return (
                  <div key={a.id} className="archive-card">
                    <div
                      className="color-bar"
                      style={{ background: b ? b.color : 'rgba(201,150,59,0.3)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="badges-row">
                        <span className="badge badge-muted">
                          {TYPE_LABELS[a.type] ?? a.type}
                        </span>
                        <span
                          className="badge"
                          style={{
                            background: `${REASON_COLORS[a.reason] ?? '#888'}22`,
                            color: REASON_COLORS[a.reason] ?? '#888',
                          }}
                        >
                          {REASON_LABELS[a.reason] ?? a.reason}
                        </span>
                        {b && (
                          <span
                            className="badge"
                            style={{
                              background: `${b.color}22`,
                              color: b.color,
                            }}
                          >
                            {b.name}
                          </span>
                        )}
                      </div>
                      <div className="item-title">
                        {(a.data.title as string) ?? '—'}
                      </div>
                      <div className="item-date">
                        أرشف {formatDate(a.archived_at)}
                      </div>
                    </div>
                    <div className="actions-row">
                      <button
                        className="btn-restore"
                        onClick={() => handleRestore(a.id)}
                        disabled={isPending}
                        title="استعادة"
                      >
                        ↩ استعادة
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(a.id)}
                        disabled={isPending}
                        title="حذف نهائي"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .page-container { padding: 24px; max-width: 900px; }
        .page-header { margin-bottom: 20px; }
        .page-title { font-size: 24px; font-weight: 800; color: var(--gold); margin: 0 0 4px; }
        .page-subtitle { font-size: 12px; color: var(--txt3); margin: 0; }
        .tabs-row { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(201,150,59,0.15); padding-bottom: 12px; }
        .tab-btn { background: transparent; border: 1px solid rgba(201,150,59,0.2); color: var(--txt2); padding: 6px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .tab-btn.active { background: rgba(201,150,59,0.15); border-color: var(--gold); color: var(--gold); }
        .tab-btn:hover:not(.active) { border-color: rgba(201,150,59,0.4); color: var(--txt1); }
        .section-body { display: flex; flex-direction: column; gap: 16px; }
        .stats-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .stat-card { flex: 1; min-width: 100px; background: rgba(255,255,255,0.02); border: 1px solid rgba(201,150,59,0.08); border-radius: 10px; padding: 14px; text-align: center; }
        .stat-num { font-size: 24px; font-weight: 800; }
        .stat-num.gold { color: var(--gold); }
        .stat-num.green { color: #22c55e; }
        .stat-num.red { color: #ef4444; }
        .stat-label { font-size: 10px; color: var(--txt3); margin-top: 4px; }
        .filters-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-select { background: rgba(255,255,255,0.03); border: 1px solid rgba(201,150,59,0.15); color: var(--txt1); padding: 6px 10px; border-radius: 6px; font-size: 11px; font-family: inherit; cursor: pointer; }
        .filter-select:focus { outline: none; border-color: var(--gold); }
        .list-col { display: flex; flex-direction: column; gap: 6px; }
        .archive-card { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(201,150,59,0.08); border-radius: 10px; transition: border-color 0.2s; }
        .archive-card:hover { border-color: rgba(201,150,59,0.2); }
        .color-bar { width: 3px; height: 40px; border-radius: 2px; flex-shrink: 0; }
        .badges-row { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; flex-wrap: wrap; }
        .badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .badge-muted { background: rgba(255,255,255,0.06); color: var(--txt3); }
        .item-title { font-size: 13px; font-weight: 600; color: var(--txt1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-date { font-size: 10px; color: var(--txt3); margin-top: 3px; }
        .actions-row { display: flex; gap: 4px; flex-shrink: 0; }
        .btn-restore { background: rgba(201,150,59,0.1); border: 1px solid rgba(201,150,59,0.3); color: var(--gold); padding: 4px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn-restore:hover { background: rgba(201,150,59,0.2); }
        .btn-restore:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-delete { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #ef4444; padding: 4px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .btn-delete:hover { background: rgba(239,68,68,0.18); }
        .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
        .brand-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .empty-state { text-align: center; padding: 48px 20px; }
        .empty-icon { font-size: 36px; margin-bottom: 12px; }
        .empty-title { font-size: 15px; font-weight: 700; color: var(--txt2); margin-bottom: 6px; }
        .empty-sub { font-size: 12px; color: var(--txt3); }
      `}</style>
    </div>
  );
}
