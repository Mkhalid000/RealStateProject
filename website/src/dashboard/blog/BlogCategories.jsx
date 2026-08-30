import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {uploadFile} from '../../lib/upload';

const input =
  'w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-fg outline-none transition-colors focus:border-gold/60 placeholder:text-muted';
const label = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted';

const EMPTY = {name: '', slug: '', description: '', coverImageUrl: '', position: 0};

export default function BlogCategories() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/blog/categories')
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function edit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      coverImageUrl: c.coverImageUrl || '',
      position: c.position ?? 0,
    });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function save(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    const payload = {...form, position: Number(form.position) || 0};
    try {
      if (editingId) {
        await apiFetch(`/blog/categories/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/blog/categories', {method: 'POST', body: JSON.stringify(payload)});
      }
      reset();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete “${c.name}”? Its articles stay, but lose their category.`)) return;
    await apiFetch(`/blog/categories/${c.id}`, {method: 'DELETE'}).catch(e => setError(e.message));
    load();
  }

  async function uploadCover(file) {
    if (!file) return;
    try {
      const r = await uploadFile(file, 'blog');
      set('coverImageUrl', r.url);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Blog categories</div>
          <p className="mt-0.5 text-sm text-muted">The rail readers filter the journal with</p>
        </div>
        <Link
          to="/admin/blog"
          className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:border-gold hover:text-gold">
          Back to articles
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.1em] text-muted">
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Slug</th>
                <th className="px-5 py-3 text-right font-semibold">Live posts</th>
                <th className="px-5 py-3 text-right font-semibold">Order</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">No categories yet.</td></tr>
              ) : (
                rows.map(c => (
                  <tr key={c.id} className="border-b border-line/70 last:border-b-0 hover:bg-surface2/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {c.coverImageUrl ? (
                          <img src={c.coverImageUrl} alt="" className="h-10 w-14 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-14 rounded-lg bg-surface2" />
                        )}
                        <div>
                          <p className="font-medium text-fg">{c.name}</p>
                          {c.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{c.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{c.slug}</td>
                    <td className="px-5 py-3.5 text-right text-muted">{c.postCount ?? 0}</td>
                    <td className="px-5 py-3.5 text-right text-muted">{c.position}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => edit(c)} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold">
                          Edit
                        </button>
                        <button onClick={() => remove(c)} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-danger transition-colors hover:border-danger">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={save} className="h-fit space-y-4 rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-fg">{editingId ? 'Edit category' : 'New category'}</p>

          <div>
            <label className={label}>Name</label>
            <input className={input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Buying Guides" />
          </div>
          <div>
            <label className={label}>Slug</label>
            <input className={input} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="buying-guides" />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea rows={3} className={`${input} resize-none`} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className={label}>Cover image</label>
            {form.coverImageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-line">
                <img src={form.coverImageUrl} alt="" className="h-28 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('coverImageUrl', '')}
                  className="absolute right-2 top-2 rounded-lg bg-ink/70 px-2 py-1 text-[11px] text-white">
                  Remove
                </button>
              </div>
            ) : (
              <label className="grid h-24 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-sm text-muted transition-colors hover:border-gold hover:text-gold">
                Upload
                <input type="file" accept="image/*" hidden onChange={e => uploadCover(e.target.files[0])} />
              </label>
            )}
          </div>
          <div>
            <label className={label}>Order</label>
            <input type="number" className={input} value={form.position} onChange={e => set('position', e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:opacity-50">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add category'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:text-fg">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
