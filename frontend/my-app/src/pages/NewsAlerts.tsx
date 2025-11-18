import React, { useEffect, useMemo, useState } from "react";
import NavBar from "./NavBar";
import "./PageStyles.css";
import newsAlertIcon from '../images/newsalert.png';

interface Item {
  id: number;
  message: string;
  action?: 'news' | 'alert' | string;
  data?: any;
  timestamp: string;
}

type OverridesMap = Record<string, { message: string; data?: any }>;

const LS_HIDDEN = 'hh_news_hidden_ids';
const LS_OVERRIDES = 'hh_news_overrides';

const chipStyle = (active: boolean) => ({
  padding: '8px 12px',
  borderRadius: 999,
  border: `1px solid ${active ? '#0d6efd' : '#e6e6e6'}`,
  color: active ? '#0d6efd' : '#444',
  background: active ? 'rgba(13,110,253,0.08)' : '#fff',
  cursor: 'pointer',
  fontSize: 13,
});

const NewsAlerts: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [posting, setPosting] = useState(false);

  const [form, setForm] = useState({
    kind: 'news' as 'news' | 'alert',
    title: '',
    body: '',
    category: 'Community',
    urgent: false,
  });

  // Edit support
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', category: 'Community', urgent: false, kind: 'news' as 'news' | 'alert' });
  const [showEdit, setShowEdit] = useState(false);

  // Local persistence helpers
  const loadHidden = (): number[] => {
    try { return JSON.parse(localStorage.getItem(LS_HIDDEN) || '[]'); } catch { return []; }
  };
  const saveHidden = (arr: number[]) => localStorage.setItem(LS_HIDDEN, JSON.stringify(arr));
  const loadOverrides = (): OverridesMap => {
    try { return JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}'); } catch { return {}; }
  };
  const saveOverrides = (map: OverridesMap) => localStorage.setItem(LS_OVERRIDES, JSON.stringify(map));

  const [hiddenIds, setHiddenIds] = useState<number[]>(loadHidden());
  const [overrides, setOverrides] = useState<OverridesMap>(loadOverrides());

  // UI filters
  const [filter, setFilter] = useState<'all' | 'news' | 'alert'>('all');

  useEffect(() => { saveHidden(hiddenIds); }, [hiddenIds]);
  useEffect(() => { saveOverrides(overrides); }, [overrides]);

  useEffect(() => {
    // admin detection
    const token = localStorage.getItem('access');
    if (!token) { setIsAdmin(false); return; }
    fetch('http://localhost:8000/api/profile/', { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => setIsAdmin(!!p?.is_staff))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    // Load News and Alerts from backend APIs
    async function load() {
      try {
        const [newsRes, alertsRes] = await Promise.all([
          fetch('http://localhost:8000/api/news/'),
          fetch('http://localhost:8000/api/alerts/'),
        ]);
        if (!newsRes.ok || !alertsRes.ok) throw new Error('Failed to fetch');
        const newsData = await newsRes.json();
        const alertsData = await alertsRes.json();

        const newsItems: Item[] = (Array.isArray(newsData) ? newsData : [])
          .map((n: any) => ({
            id: n.id,
            message: `📰 ${n.title}\n\n${n.content}`,
            action: 'news',
            data: { category: 'Community', urgent: false },
            timestamp: n.created_at,
          }));

        const alertItems: Item[] = (Array.isArray(alertsData) ? alertsData : [])
          .map((a: any) => ({
            id: a.id,
            message: `🚨 ${a.title}\n\n${a.message}`,
            action: 'alert',
            data: { category: a.severity || 'warning', urgent: a.severity === 'critical' },
            timestamp: a.created_at,
          }));

        setItems([...newsItems, ...alertItems]);
      } catch (e) {
        setError('Failed to load News & Alerts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const applied = useMemo(() => {
    // Apply local overrides and hidden filters
    const map = overrides;
    return items
      .filter(i => !hiddenIds.includes(i.id))
      .filter(i => filter === 'all' ? true : i.action === filter)
      .map(i => {
        const o = map[i.id];
        if (!o) return i;
        return { ...i, message: o.message ?? i.message, data: { ...i.data, ...(o.data || {}) } };
      });
  }, [items, hiddenIds, overrides, filter]);

  const sorted = useMemo(() => {
    const arr = [...applied];
    arr.sort((a, b) => {
      const au = a.data?.urgent ? 1 : 0;
      const bu = b.data?.urgent ? 1 : 0;
      if (au !== bu) return bu - au;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return arr;
  }, [applied]);

  const ringColor = (action?: string) => action === 'alert' ? '#dc3545' : '#0d6efd';

  const submitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setPosting(true);

    const token = localStorage.getItem('access');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      if (form.kind === 'news') {
        const res = await fetch('http://localhost:8000/api/news/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ title: form.title, content: form.body, is_published: true }),
        });
        if (!res.ok) throw new Error('Failed');
        const created = await res.json();
        setItems(prev => [{
          id: created.id,
          message: `📰 ${created.title}\n\n${created.content}`,
          action: 'news',
          data: { category: form.category, urgent: false },
          timestamp: created.created_at || new Date().toISOString(),
        }, ...prev]);
      } else {
        const res = await fetch('http://localhost:8000/api/alerts/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ title: form.title, message: form.body, severity: form.urgent ? 'critical' : 'warning', is_active: true }),
        });
        if (!res.ok) throw new Error('Failed');
        const created = await res.json();
        setItems(prev => [{
          id: created.id,
          message: `🚨 ${created.title}\n\n${created.message}`,
          action: 'alert',
          data: { category: created.severity || 'warning', urgent: created.severity === 'critical' },
          timestamp: created.created_at || new Date().toISOString(),
        }, ...prev]);
      }

      setShowModal(false);
      setForm({ kind: 'news', title: '', body: '', category: 'Community', urgent: false });
    } catch (err) {
      setError('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  // Admin-only edit/delete (local persistence)
  const onDelete = (id: number) => {
    if (!window.confirm('Remove this item from your admin view? This does not delete globally.')) return;
    setHiddenIds(prev => Array.from(new Set([...prev, id])));
  };

  const onEdit = (it: Item) => {
    setEditId(it.id);
    // Parse message into title/body if possible (split first line)
    const lines = (it.message || '').split('\n');
    const first = lines[0] || '';
    const rest = lines.slice(2).join('\n');
    const isAlert = (it.action === 'alert');
    setEditForm({
      kind: isAlert ? 'alert' : 'news',
      title: first.replace(/^((🚨|📰)\s*)?/, ''),
      body: rest || it.message,
      category: it.data?.category || 'Community',
      urgent: !!it.data?.urgent,
    });
    setShowEdit(true);
  };

  const onSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId == null) return;
    const newMessage = `${editForm.kind === 'alert' ? '🚨' : '📰'} ${editForm.title}\n\n${editForm.body}`;
    const newData = { category: editForm.category, urgent: editForm.urgent };
    setOverrides(prev => ({ ...prev, [editId]: { message: newMessage, data: newData } }));
    setShowEdit(false);
    setEditId(null);
  };

  return (
    <>
      <NavBar />
      <div className="page-container" style={{ maxWidth: 1100 }}>
        {/* Header / Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
             <img
        src={newsAlertIcon}
        alt="News & Alerts"
        style={{ width: 60, height: 'auto', objectFit: 'contain' }}
      />
            <h1 style={{ margin: 0 }}>News & Alerts</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={chipStyle(filter === 'all')} onClick={() => setFilter('all')}>All</button>
              <button style={chipStyle(filter === 'news')} onClick={() => setFilter('news')}>News</button>
              <button style={chipStyle(filter === 'alert')} onClick={() => setFilter('alert')}>Alerts</button>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{
              background: 'linear-gradient(135deg,#2e6F40,#17824f)',
              color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              boxShadow: '0 6px 14px rgba(0,0,0,0.12)'
            }}>+ New</button>
          )}
        </div>
        <p style={{ color: '#555', marginTop: 8 }}>Stay updated with announcements, advisories, and urgent alerts.</p>

        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        {!loading && !error && sorted.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 12, padding: 24, textAlign: 'center', color: '#666' }}>
            No news or alerts yet. {isAdmin ? 'Click “+ New” to post an update.' : 'Please check back later.'}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {sorted.map((n) => (
            <div key={n.id}
                 className="news-card"
                 style={{
                   position: 'relative',
                   borderLeft: `4px solid ${ringColor(n.action)}`,
                   background: '#fff',
                   border: '1px solid #eaeaea',
                   borderRadius: 14,
                   padding: 16,
                   boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                   transition: 'transform .15s ease, box-shadow .15s ease',
                 }}
                 onMouseEnter={(e) => {
                   (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                   (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.10)';
                 }}
                 onMouseLeave={(e) => {
                   (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                   (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                 }}>
              {n.data?.urgent && (
                <span style={{ position: 'absolute', top: 10, right: 10, background: '#ffc107', color: '#111', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>URGENT</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ringColor(n.action) }} />
                <strong style={{ color: ringColor(n.action), letterSpacing: .5 }}>{(n.action || 'news').toUpperCase()}</strong>
                {n.data?.category && <span style={{ fontSize: 12, color: '#666', paddingLeft: 6 }}>• {n.data.category}</span>}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#2b2b2b', lineHeight: 1.6 }}>{n.message}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>{new Date(n.timestamp).toLocaleString()}</div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                  <button onClick={() => onEdit(n)}
                          style={{ background: '#fff', border: '1px solid #d1e7dd', color: '#198754', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>
                     Edit
                  </button>
                  <button onClick={() => onDelete(n.id)}
                          style={{ background: '#fff', border: '1px solid #f5c2c7', color: '#dc3545', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>
                     Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: 'min(560px, 92vw)', background: '#fff', borderRadius: 16, padding: 50, boxShadow: '0 16px 36px rgba(0,0,0,0.2)', marginTop: 110 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <img src={newsAlertIcon} alt="News & Alerts" style={{ width: 40, height: 'auto', objectFit: 'contain' }} />
              <h3 style={{ marginTop: 0, marginBottom: 0 }}>Create News / Alert</h3>
            </div>
            <form onSubmit={submitNews}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="kind" checked={form.kind === 'news'} onChange={() => setForm({ ...form, kind: 'news' })} /> News
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="kind" checked={form.kind === 'alert'} onChange={() => setForm({ ...form, kind: 'alert' })} /> Alert
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  <input type="checkbox" checked={form.urgent} onChange={(e) => setForm({ ...form, urgent: e.target.checked })} /> Mark urgent
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd' }}
                  placeholder="Headline"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minHeight: 120, resize: 'vertical' }}
                  placeholder="Write the content"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minWidth: 160 }}
                >
                  <option>Community</option>
                  <option>Policy</option>
                  <option>Maintenance</option>
                  <option>Safety</option>
                  <option>Events</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={posting} style={{ background: form.kind === 'alert' ? '#dc3545' : '#0d6efd', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>{posting ? 'Posting…' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && editId != null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: 'min(560px, 92vw)', background: '#fff', borderRadius: 16, padding: 50, boxShadow: '0 16px 36px rgba(0,0,0,0.2)', marginTop: 110 }}>
            <h3 style={{ marginTop: 0 }}>Edit News / Alert</h3>
            <form onSubmit={onSaveEdit}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="edit_kind" checked={editForm.kind === 'news'} onChange={() => setEditForm({ ...editForm, kind: 'news' })} /> News
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="edit_kind" checked={editForm.kind === 'alert'} onChange={() => setEditForm({ ...editForm, kind: 'alert' })} /> Alert
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  <input type="checkbox" checked={editForm.urgent} onChange={(e) => setEditForm({ ...editForm, urgent: e.target.checked })} /> Mark urgent
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Title</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd' }}
                  placeholder="Headline"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Body</label>
                <textarea
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minHeight: 120, resize: 'vertical' }}
                  placeholder="Write the content"
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', minWidth: 160 }}
                >
                  <option>Community</option>
                  <option>Policy</option>
                  <option>Maintenance</option>
                  <option>Safety</option>
                  <option>Events</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => { setShowEdit(false); setEditId(null); }} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: editForm.kind === 'alert' ? '#dc3545' : '#0d6efd', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>Save</button>
        </div>
            </form>
        </div>
      </div>
      )}
    </>
  );
};

export default NewsAlerts;
