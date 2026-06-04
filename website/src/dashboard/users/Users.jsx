import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

const LIMIT = 10;

const ROLE = {
  admin: {chip: 'bg-violet-100 text-violet-700', label: 'Admin'},
  agent: {chip: 'bg-amber-100 text-amber-700', label: 'Agent'},
  user: {chip: 'bg-blue-100 text-blue-700', label: 'Buyer'},
};

const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}) : '—');

// MUI theme matching the dashboard (gold primary, Inter, light surfaces).
const muiTheme = createTheme({
  palette: {
    primary: {main: '#f2a65a', dark: '#d98a3e', contrastText: '#211d1d'},
    success: {main: '#10b981'},
    text: {primary: '#11111b', secondary: '#636274'},
  },
  typography: {fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13},
  shape: {borderRadius: 9},
  components: {
    MuiOutlinedInput: {styleOverrides: {root: {backgroundColor: '#fff', '& fieldset': {borderColor: '#e2e4eb'}}}},
    MuiButton: {styleOverrides: {root: {textTransform: 'none', fontWeight: 600, boxShadow: 'none'}}},
  },
});

// shared MUI TableCell styling
const headSx = {
  backgroundColor: '#f8f9fb',
  color: '#8a8d99',
  fontWeight: 700,
  fontSize: 10.5,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  borderBottom: '1px solid #e2e4eb',
  py: 1.5,
};
const cellSx = {borderBottom: '1px solid #f0f1f5', py: 1.5};

export default function Users() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' | 'table'
  const [openMenu, setOpenMenu] = useState(null); // user id whose menu is open
  const [confirm, setConfirm] = useState(null); // {title, body, onYes}

  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({page: String(page), limit: String(LIMIT)});
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
    if (q) params.set('q', q);
    apiFetch(`/admin/users?${params.toString()}`)
      .then(r => { setRows(r.items || []); setTotal(r.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, roleFilter, verifiedFilter, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [roleFilter, verifiedFilter]);

  async function setVerification(u, verificationStatus) {
    setBusy(u.id);
    try {
      await apiFetch(`/admin/users/${u.id}/verify`, {method: 'PATCH', body: JSON.stringify({verificationStatus})});
      load();
    } finally {
      setBusy(null);
    }
  }

  function deleteUser(u) {
    setConfirm({
      title: 'Delete user',
      body: `Are you sure you want to permanently delete "${u.fullName || u.email}"? This action cannot be undone.`,
      danger: true,
      yesLabel: 'Yes, delete',
      onYes: async () => {
        setBusy(u.id);
        try {
          await apiFetch(`/admin/users/${u.id}`, {method: 'DELETE'});
          load();
        } catch (err) {
          setError(err.message || 'Delete failed');
        } finally {
          setBusy(null);
        }
      },
    });
  }

  function toggleActive(u) {
    const deactivating = u.isActive !== false;
    setConfirm({
      title: deactivating ? 'Deactivate user' : 'Activate user',
      body: deactivating
        ? `Deactivate "${u.fullName || u.email}"? They will not be able to login until reactivated.`
        : `Activate "${u.fullName || u.email}"? They will be able to login again.`,
      danger: deactivating,
      yesLabel: deactivating ? 'Yes, deactivate' : 'Yes, activate',
      onYes: async () => {
        setBusy(u.id);
        try {
          await apiFetch(`/admin/users/${u.id}/active`, {
            method: 'PATCH',
            body: JSON.stringify({isActive: !deactivating}),
          });
          load();
        } catch (err) {
          setError(err.message || 'Failed to update status');
        } finally {
          setBusy(null);
        }
      },
    });
  }

  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <ThemeProvider theme={muiTheme}>
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Users &amp; Agents</div>
          <p className="mt-0.5 text-sm text-muted">Manage buyers, agents and administrators</p>
        </div>
        <Button
          variant="contained"
          onClick={() => setShowAdd(true)}
          startIcon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 13 0M18 8v6M21 11h-6"/></svg>}>
          Add Agent
        </Button>
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <TextField
          size="small"
          placeholder="Search name or email"
          value={qInput}
          onChange={e => setQInput(e.target.value)}
          sx={{minWidth: 240}}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </InputAdornment>
            ),
          }}
        />
        <TextField select size="small" label="Role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} sx={{minWidth: 150}}>
          <MenuItem value="all">All roles</MenuItem>
          <MenuItem value="user">Buyers</MenuItem>
          <MenuItem value="agent">Agents</MenuItem>
          <MenuItem value="admin">Admins</MenuItem>
        </TextField>
        <TextField select size="small" label="Status" value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)} sx={{minWidth: 160}}>
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="verified">Verified</MenuItem>
          <MenuItem value="unverified">Unverified</MenuItem>
        </TextField>
        <div className="flex-1" />
        <span className="text-sm text-muted">{total} {total === 1 ? 'user' : 'users'}</span>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-line bg-bg p-0.5 gap-0.5">
          <button
            title="Grid view"
            onClick={() => setView('grid')}
            className={`grid h-8 w-8 place-items-center rounded-md transition ${view === 'grid' ? 'bg-white shadow text-gold' : 'text-muted hover:text-fg'}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </button>
          <button
            title="Table view"
            onClick={() => setView('table')}
            className={`grid h-8 w-8 place-items-center rounded-md transition ${view === 'table' ? 'bg-white shadow text-gold' : 'text-muted hover:text-fg'}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 5h18M3 10h18M3 15h18M3 20h18"/>
            </svg>
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      ) : null}

      {/* ── Grid view ── */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading
            ? Array.from({length: 10}).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-5">
                  <Skeleton variant="circular" width={80} height={80} animation="wave" />
                  <Skeleton variant="text" width={100} height={18} animation="wave" />
                  <Skeleton variant="text" width={130} height={13} animation="wave" />
                  <Skeleton variant="rounded" width={64} height={22} animation="wave" />
                </div>
              ))
            : rows.length
            ? rows.map(u => {
                const rc = ROLE[u.role] || ROLE.user;
                const initial = (u.fullName || u.email || 'U').charAt(0).toUpperCase();
                return (
                  <div
                    key={u.id}
                    className="relative flex flex-col items-center rounded-2xl border border-line bg-surface p-5 text-center shadow-sm transition hover:shadow-md"
                    onMouseLeave={() => setOpenMenu(null)}>

                    {/* Three-dot menu button */}
                    <div className="absolute right-2.5 top-2.5">
                      <button
                        onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }}
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-bg hover:text-fg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>

                      {/* Dropdown */}
                      {openMenu === u.id && (
                        <div className="absolute right-0 top-8 z-50 min-w-[168px] overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                          {u.role === 'agent' && (
                            <>
                              <DropItem
                                icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></>}
                                label="Verify agent"
                                onClick={() => { setOpenMenu(null); setVerification(u, 'verified'); }}
                              />
                              <DropItem
                                icon={<><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></>}
                                label="Reject agent"
                                danger
                                onClick={() => { setOpenMenu(null); setVerification(u, 'rejected'); }}
                              />
                              <div className="my-1 border-t border-line" />
                            </>
                          )}
                          <DropItem
                            icon={u.isActive
                              ? <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93 19.07 19.07"/></>
                              : <><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></>}
                            label={u.isActive ? 'Deactivate' : 'Activate'}
                            danger={u.isActive}
                            onClick={() => { setOpenMenu(null); toggleActive(u); }}
                          />
                          <div className="my-1 border-t border-line" />
                          <DropItem
                            icon={<><path d="M3 6h18"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/></>}
                            label="Delete user"
                            danger
                            onClick={() => { setOpenMenu(null); deleteUser(u); }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Avatar — real image or coloured initial */}
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.fullName}
                        className="h-20 w-20 rounded-full object-cover ring-2 ring-line"
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    {/* Fallback initials (always rendered, hidden when image loads) */}
                    <span
                      className={`grid h-20 w-20 shrink-0 place-items-center rounded-full text-2xl font-bold ring-2 ring-line ${rc.chip} ${u.avatarUrl ? 'hidden' : ''}`}>
                      {initial}
                    </span>

                    <div className="mt-3 w-full min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{u.fullName || '—'}</p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                      {u.phone && <p className="mt-0.5 text-xs text-muted">{u.phone}</p>}
                    </div>

                    {/* Deactivated overlay hint */}
                    {u.isActive === false && (
                      <div className="mb-1 mt-1.5 w-full rounded-lg bg-red-50 px-2 py-1 text-center text-[11px] font-semibold text-red-500">
                        ⛔ Deactivated — cannot login
                      </div>
                    )}

                    {/* Role + Status inline */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${rc.chip}`}>
                        {rc.label}
                      </span>
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                        </span>
                      ) : u.verificationStatus === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Rejected
                        </span>
                      ) : u.verificationStatus === 'pending' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" /> Unverified
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[10.5px] text-muted">{fmtDate(u.createdAt)}</p>
                  </div>
                );
              })
            : (
              <div className="col-span-full py-16 text-center text-muted">No users match these filters.</div>
            )}
        </div>
      )}

      {/* ── Table view ── */}
      {view === 'table' && (
        <TableContainer component={Paper} variant="outlined" sx={{borderColor: '#e2e4eb', borderRadius: '16px', overflow: 'hidden'}}>
          <Table sx={{'& td, & th': {borderColor: '#f0f1f5'}}}>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>User</TableCell>
                <TableCell sx={headSx}>Role</TableCell>
                <TableCell sx={headSx}>Phone</TableCell>
                <TableCell sx={headSx}>Joined</TableCell>
                <TableCell sx={headSx}>Verification</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({length: 6}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell sx={cellSx}>
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width={36} height={36} animation="wave" />
                        <div>
                          <Skeleton variant="text" width={140} height={18} animation="wave" />
                          <Skeleton variant="text" width={180} height={13} animation="wave" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="rounded" width={64} height={22} animation="wave" /></TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="text" width={110} animation="wave" /></TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="text" width={90} animation="wave" /></TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="rounded" width={120} height={34} animation="wave" /></TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map(u => {
                  const rc = ROLE[u.role] || ROLE.user;
                  const initial = (u.fullName || u.email || 'U').charAt(0).toUpperCase();
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell sx={cellSx}>
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.fullName}
                              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-line"
                              onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'grid'; }} />
                          ) : null}
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${rc.chip} ${u.avatarUrl ? 'hidden' : ''}`}>
                            {initial}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-fg">{u.fullName || '—'}</div>
                            <div className="text-xs text-muted">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${rc.chip}`}>{rc.label}</span>
                      </TableCell>
                      <TableCell sx={cellSx}><span className="text-sm text-muted">{u.phone || '—'}</span></TableCell>
                      <TableCell sx={cellSx}><span className="text-sm text-muted">{fmtDate(u.createdAt)}</span></TableCell>
                      <TableCell sx={cellSx}>
                        {u.role === 'agent' && !u.isVerified ? (
                          <TextField select size="small" value={u.verificationStatus || 'pending'}
                            disabled={busy === u.id}
                            onChange={e => setVerification(u, e.target.value)}
                            sx={{minWidth: 140}}>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="verified">Verify ✓</MenuItem>
                            <MenuItem value="rejected">Reject ✕</MenuItem>
                          </TextField>
                        ) : u.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-500">Unverified</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell sx={{...cellSx, borderBottom: 'none'}} colSpan={5}>
                    <div className="py-10 text-center text-muted">No users match these filters.</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* pagination */}
      {!loading && total > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        </div>
      )}

      {showAdd && <AddAgentModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); setRoleFilter('agent'); setPage(1); load(); }} />}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          body={confirm.body}
          danger={confirm.danger}
          yesLabel={confirm.yesLabel}
          onYes={() => { confirm.onYes(); setConfirm(null); }}
          onNo={() => setConfirm(null)}
        />
      )}
    </ThemeProvider>
  );
}

function ConfirmModal({title, body, danger, yesLabel = 'Yes', onYes, onNo}) {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={onNo}>
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onMouseDown={e => e.stopPropagation()}>

        {/* Icon */}
        <div className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          {danger ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={danger ? '#ef4444' : '#f59e0b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
          )}
        </div>

        <h3 className="text-center text-lg font-bold text-fg">{title}</h3>
        <p className="mt-1.5 text-center text-sm text-muted">{body}</p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onNo}
            className="flex-1 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-line">
            No, cancel
          </button>
          <button
            onClick={onYes}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition
              ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
            {yesLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DropItem({icon, label, danger, onClick}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition
        ${danger ? 'text-red-500 hover:bg-red-50' : 'text-fg hover:bg-bg'}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </button>
  );
}

function AddAgentModal({onClose, onCreated}) {
  const [form, setForm] = useState({fullName: '', email: '', password: '', phone: '', agencyName: ''});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 6) {
      return setError('Name, email and a password (min 6 chars) are required.');
    }
    setSaving(true);
    try {
      await apiFetch('/admin/agents', {method: 'POST', body: JSON.stringify(form)});
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create agent');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/45 p-5 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-[540px] overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onMouseDown={e => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-fg">Add Agent</h2>
            <p className="mt-0.5 text-sm text-muted">This agent will be verified automatically and can sign in right away.</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-bg" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-4">
          <TextField label="Full Name" required size="small" fullWidth value={form.fullName} onChange={e => set('fullName', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Email" type="email" required size="small" fullWidth value={form.email} onChange={e => set('email', e.target.value)} />
            <TextField label="Password" type="password" required size="small" fullWidth value={form.password} onChange={e => set('password', e.target.value)} helperText="Min 6 characters" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Phone" size="small" fullWidth value={form.phone} onChange={e => set('phone', e.target.value)} />
            <TextField label="Agency" size="small" fullWidth value={form.agencyName} onChange={e => set('agencyName', e.target.value)} />
          </div>

          {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div> : null}

          <div className="mt-1 flex justify-end gap-2.5">
            <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Creating…' : 'Create Agent'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
