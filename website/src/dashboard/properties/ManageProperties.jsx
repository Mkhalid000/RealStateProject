import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Pagination from '@mui/material/Pagination';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const LIMIT = 10;
const TYPES = ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'];
const SORTS = [
  {value: 'newest', label: 'Newest first'},
  {value: 'oldest', label: 'Oldest first'},
  {value: 'price_desc', label: 'Price: High → Low'},
  {value: 'price_asc', label: 'Price: Low → High'},
  {value: 'title_asc', label: 'Title: A → Z'},
];

const TYPE_COLORS = {
  apartment: '#3b82f6', villa: '#8b5cf6', plot: '#10b981',
  commercial: '#f59e0b', office: '#6366f1', shop: '#ec4899',
};

const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

const STATUS = {
  verified: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  rejected: 'bg-red-50 text-red-600',
};

const muiTheme = createTheme({
  palette: {
    primary: {main: '#f2a65a', dark: '#d98a3e', contrastText: '#211d1d'},
    text: {primary: '#11111b', secondary: '#636274'},
  },
  typography: {fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13},
  shape: {borderRadius: 9},
  components: {
    MuiOutlinedInput: {styleOverrides: {root: {backgroundColor: '#fff', '& fieldset': {borderColor: '#e2e4eb'}}}},
    MuiButton: {styleOverrides: {root: {textTransform: 'none', fontWeight: 600, boxShadow: 'none'}}},
  },
});

const headSx = {
  backgroundColor: '#f8f9fb', color: '#8a8d99', fontWeight: 700, fontSize: 10.5,
  letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #e2e4eb', py: 1.5,
};
const cellSx = {borderBottom: '1px solid #f0f1f5', py: 1.5};

function StatusChip({status}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS[status] || 'bg-neutral-100 text-neutral-500'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> {status}
    </span>
  );
}

function TypeChip({type}) {
  const c = TYPE_COLORS[type] || '#6366f1';
  return (
    <span style={{background: `${c}15`, color: c, border: `1px solid ${c}30`}}
      className="rounded-md px-2 py-0.5 text-[11.5px] font-semibold capitalize">
      {type}
    </span>
  );
}

export default function ManageProperties() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');

  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [agentInput, setAgentInput] = useState('');
  const [agent, setAgent] = useState('');
  const [verification, setVerification] = useState('all');
  const [type, setType] = useState('all');
  const [listing, setListing] = useState('all');
  const [sort, setSort] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [menu, setMenu] = useState({anchor: null, row: null});

  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    const t = setTimeout(() => { setAgent(agentInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [agentInput]);

  useEffect(() => { setPage(1); }, [verification, type, listing, sort]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({page: String(page), limit: String(LIMIT), sort});
    if (verification !== 'all') params.set('verification', verification);
    if (type !== 'all') params.set('type', type);
    if (listing !== 'all') params.set('listingType', listing);
    if (q) params.set('q', q);
    if (agent) params.set('agent', agent);
    apiFetch(`/properties/admin?${params.toString()}`)
      .then(r => { setRows(r.items || []); setTotal(r.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, verification, type, listing, sort, q, agent]);

  useEffect(() => { load(); }, [load]);

  const openMenu = (e, row) => setMenu({anchor: e.currentTarget, row});
  const closeMenu = () => setMenu({anchor: null, row: null});

  async function setVerification2(id, verificationStatus) {
    setBusy(id);
    closeMenu();
    try {
      await apiFetch(`/properties/${id}/verify`, {method: 'PATCH', body: JSON.stringify({verificationStatus})});
      load();
    } finally { setBusy(null); }
  }

  async function remove(id) {
    closeMenu();
    if (!confirm('Delete this property? This cannot be undone.')) return;
    setBusy(id);
    try {
      await apiFetch(`/properties/${id}`, {method: 'DELETE'});
      load();
    } finally { setBusy(null); }
  }

  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <ThemeProvider theme={muiTheme}>
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Properties</div>
          <p className="text-sm text-muted">Manage listings, verification and details</p>
        </div>
        <Button
          variant="contained"
          component={Link}
          to="/admin/properties/new"
          startIcon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>}>
          Add Property
        </Button>
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <TextField
          size="small"
          placeholder="Search title or location"
          value={qInput}
          onChange={e => setQInput(e.target.value)}
          sx={{minWidth: 230}}
          InputProps={{startAdornment: (
            <InputAdornment position="start">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </InputAdornment>
          )}}
        />
        <TextField
          size="small"
          placeholder="Filter by agent"
          value={agentInput}
          onChange={e => setAgentInput(e.target.value)}
          sx={{minWidth: 180}}
          InputProps={{startAdornment: (
            <InputAdornment position="start">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>
            </InputAdornment>
          )}}
        />
        <TextField select size="small" label="Status" value={verification} onChange={e => setVerification(e.target.value)} sx={{minWidth: 140}}>
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="verified">Verified</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
        <TextField select size="small" label="Type" value={type} onChange={e => setType(e.target.value)} sx={{minWidth: 130}}>
          <MenuItem value="all">All types</MenuItem>
          {TYPES.map(t => <MenuItem key={t} value={t} sx={{textTransform: 'capitalize'}}>{t}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Listing" value={listing} onChange={e => setListing(e.target.value)} sx={{minWidth: 120}}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="buy">Buy</MenuItem>
          <MenuItem value="rent">Rent</MenuItem>
        </TextField>
        <TextField select size="small" label="Sort" value={sort} onChange={e => setSort(e.target.value)} sx={{minWidth: 180}}>
          {SORTS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </TextField>

        <div className="flex-1" />
        <span className="text-sm text-muted">{total} {total === 1 ? 'property' : 'properties'}</span>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(e, v) => v && setView(v)}
          sx={{'& .MuiToggleButton-root': {borderColor: '#e2e4eb', px: 1.2}, '& .Mui-selected': {backgroundColor: 'rgba(242,166,90,0.12) !important', color: '#d98a3e'}}}>
          <ToggleButton value="table" aria-label="table view">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 5h18M3 12h18M3 19h18"/></svg>
          </ToggleButton>
          <ToggleButton value="grid" aria-label="grid view">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div> : null}

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
        <TableContainer component={Paper} variant="outlined" sx={{borderColor: '#e2e4eb', borderRadius: '16px', overflow: 'hidden'}}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Property</TableCell>
                <TableCell sx={headSx}>Location</TableCell>
                <TableCell sx={headSx}>Type</TableCell>
                <TableCell sx={headSx}>Price</TableCell>
                <TableCell sx={headSx}>Listing</TableCell>
                <TableCell sx={headSx}>Status</TableCell>
                <TableCell sx={headSx} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({length: 6}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell sx={cellSx}>
                      <div className="flex items-center gap-3">
                        <Skeleton variant="rounded" width={52} height={38} animation="wave" />
                        <Skeleton variant="text" width={150} animation="wave" />
                      </div>
                    </TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="text" width={110} animation="wave" /></TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="rounded" width={64} height={20} animation="wave" /></TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="text" width={70} animation="wave" /></TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="text" width={40} animation="wave" /></TableCell>
                    <TableCell sx={cellSx}><Skeleton variant="rounded" width={80} height={22} animation="wave" /></TableCell>
                    <TableCell sx={cellSx} align="right"><Skeleton variant="circular" width={28} height={28} animation="wave" sx={{ml: 'auto'}} /></TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map(p => (
                  <TableRow key={p.id} hover sx={{cursor: 'pointer'}} onClick={() => navigate(`/admin/properties/${p.id}`)}>
                    <TableCell sx={cellSx}>
                      <div className="flex items-center gap-3">
                        {p.imageUrls?.[0] ? (
                          <img src={p.imageUrls[0]} alt="" style={{width: 52, height: 38, objectFit: 'cover', borderRadius: 7, border: '1px solid #e2e4eb'}} />
                        ) : (
                          <div className="grid h-[38px] w-[52px] place-items-center rounded-md border border-line bg-bg">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="1.5"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="max-w-[220px] truncate text-[13.5px] font-semibold text-fg">{p.title}</div>
                          <div className="text-[11.5px] text-muted">{p.featured && <span className="mr-1 text-gold-dark">★ Featured</span>}ID: {p.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell sx={cellSx}><span className="text-sm text-muted">{[p.locality, p.city].filter(Boolean).join(', ') || p.state || '—'}</span></TableCell>
                    <TableCell sx={cellSx}><TypeChip type={p.type} /></TableCell>
                    <TableCell sx={cellSx}><span className="font-semibold text-fg">{money(p.price, p.currency)}</span></TableCell>
                    <TableCell sx={cellSx}><span className="text-sm capitalize text-muted">{p.listingType}</span></TableCell>
                    <TableCell sx={cellSx}><StatusChip status={p.verificationStatus} /></TableCell>
                    <TableCell sx={cellSx} align="right" onClick={e => e.stopPropagation()}>
                      <IconButton size="small" disabled={busy === p.id} onClick={e => openMenu(e, p)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636274" strokeWidth="2"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell sx={{...cellSx, borderBottom: 'none'}} colSpan={7}>
                    <div className="py-12 text-center text-muted">No properties match these filters.</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({length: 6}).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <Skeleton variant="rectangular" height={150} animation="wave" />
                <div className="p-4">
                  <Skeleton variant="text" width="70%" animation="wave" />
                  <Skeleton variant="text" width="40%" animation="wave" />
                </div>
              </div>
            ))
          ) : rows.length ? (
            rows.map(p => (
              <div key={p.id} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
                <div className="relative h-40 w-full cursor-pointer bg-bg" onClick={() => navigate(`/admin/properties/${p.id}`)}>
                  {p.imageUrls?.[0] ? (
                    <img src={p.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#cbd0da" strokeWidth="1.4"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>
                    </div>
                  )}
                  <div className="absolute left-3 top-3"><StatusChip status={p.verificationStatus} /></div>
                  <div className="absolute right-2 top-2" onClick={e => e.stopPropagation()}>
                    <IconButton size="small" disabled={busy === p.id} onClick={e => openMenu(e, p)} sx={{backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': {backgroundColor: '#fff'}}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#11111b" strokeWidth="2"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
                    </IconButton>
                  </div>
                </div>
                <div className="cursor-pointer p-4" onClick={() => navigate(`/admin/properties/${p.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate text-sm font-semibold text-fg">{p.title}</div>
                    <TypeChip type={p.type} />
                  </div>
                  <div className="mt-1 truncate text-xs text-muted">{[p.locality, p.city].filter(Boolean).join(', ') || p.state || '—'}</div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className=" text-md font-bold text-gold-dark">{money(p.price, p.currency)}</span>
                    <span className="text-xs font-semibold capitalize text-fg">{p.listingType}</span>
                  </div>
                  {/* added-by agent */}
                  <div className="mt-3 border-t border-line pt-3">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">Added by</div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-[11px] font-bold text-gold-dark">
                        {(p.agent?.fullName || 'A').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-fg">{p.agent?.fullName || 'Unknown'}</div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted">
                          {p.agent?.phone && (
                            <span className="inline-flex items-center gap-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/></svg>{p.agent.phone}</span>
                          )}
                          {p.agent?.email && (
                            <span className="inline-flex min-w-0 items-center gap-1"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg><span className="truncate">{p.agent.email}</span></span>
                          )}
                          {!p.agent?.phone && !p.agent?.email && <span>No contact info</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-line bg-surface py-12 text-center text-muted">No properties match these filters.</div>
          )}
        </div>
      )}

      {/* shared 3-dot action menu */}
      <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={closeMenu}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} transformOrigin={{vertical: 'top', horizontal: 'right'}}>
        <MenuItem onClick={() => { const id = menu.row.id; closeMenu(); navigate(`/admin/properties/${id}`); }}>View details</MenuItem>
        <MenuItem onClick={() => { const id = menu.row.id; closeMenu(); navigate(`/admin/properties/${id}/edit`); }}>Edit</MenuItem>
        {menu.row && menu.row.verificationStatus !== 'verified' && (
          <MenuItem onClick={() => setVerification2(menu.row.id, 'verified')} sx={{color: '#10b981'}}>Verify</MenuItem>
        )}
        {menu.row && menu.row.verificationStatus !== 'rejected' && (
          <MenuItem onClick={() => setVerification2(menu.row.id, 'rejected')} sx={{color: '#d98a3e'}}>Reject</MenuItem>
        )}
        {menu.row && <MenuItem onClick={() => remove(menu.row.id)} sx={{color: '#e0654f'}}>Delete</MenuItem>}
      </Menu>

      {/* pagination */}
      {!loading && total > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        </div>
      )}
    </ThemeProvider>
  );
}
