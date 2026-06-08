import {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {parseVideo, embedSrc} from '../../lib/video';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
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
import Dialog from '@mui/material/Dialog';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const LIMIT = 10;
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}) : '—');
const fmtCount = n => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n ?? 0));
const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

const I = {
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />,
  comment: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10" />,
};
const Svg = ({d, size = 13}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const muiTheme = createTheme({
  palette: {primary: {main: '#f2a65a', dark: '#d98a3e', contrastText: '#211d1d'}, text: {primary: '#11111b', secondary: '#636274'}},
  typography: {fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13},
  shape: {borderRadius: 9},
  components: {
    MuiOutlinedInput: {styleOverrides: {root: {backgroundColor: '#fff', '& fieldset': {borderColor: '#e2e4eb'}}}},
  },
});

const headSx = {
  backgroundColor: '#f8f9fb', color: '#8a8d99', fontWeight: 700, fontSize: 10.5,
  letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #e2e4eb', py: 1.5,
};
const cellSx = {borderBottom: '1px solid #f0f1f5', py: 1.5};

export default function Reels() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [boosted, setBoosted] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [menu, setMenu] = useState({anchor: null, row: null});
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);
  useEffect(() => { setPage(1); }, [boosted]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({page: String(page), limit: String(LIMIT)});
    if (q) params.set('q', q);
    if (boosted !== 'all') params.set('boosted', boosted);
    apiFetch(`/reels/feed?${params.toString()}`)
      .then(r => { setRows(r.items || []); setTotal(r.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, q, boosted]);

  useEffect(() => { load(); }, [load]);

  const openMenu = (e, row) => setMenu({anchor: e.currentTarget, row});
  const closeMenu = () => setMenu({anchor: null, row: null});

  async function remove(id) {
    closeMenu();
    if (!confirm('Delete this reel? This cannot be undone.')) return;
    setBusy(id);
    try {
      await apiFetch(`/admin/reels/${id}`, {method: 'DELETE'});
      load();
    } finally { setBusy(null); }
  }

  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Reels</div>
          <p className="mt-0.5 text-sm text-muted">Moderate and publish property reels</p>
        </div>
        <Button
          variant="contained"
          component={Link}
          to="/admin/reels/new"
          startIcon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>}>
          Add Reel
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <TextField
          size="small"
          placeholder="Search caption or agent"
          value={qInput}
          onChange={e => setQInput(e.target.value)}
          sx={{minWidth: 240}}
          InputProps={{startAdornment: (
            <InputAdornment position="start">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0a3b1" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </InputAdornment>
          )}}
        />
        <TextField select size="small" label="Boost" value={boosted} onChange={e => setBoosted(e.target.value)} sx={{minWidth: 150}}>
          <MenuItem value="all">All reels</MenuItem>
          <MenuItem value="true">Boosted</MenuItem>
          <MenuItem value="false">Not boosted</MenuItem>
        </TextField>
        <div className="flex-1" />
        <span className="text-sm text-muted">{total} {total === 1 ? 'reel' : 'reels'}</span>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(e, v) => v && setView(v)}
          sx={{'& .MuiToggleButton-root': {borderColor: '#e2e4eb', px: 1.2}, '& .Mui-selected': {backgroundColor: 'rgba(242,166,90,0.12) !important', color: '#d98a3e'}}}>
          <ToggleButton value="grid" aria-label="grid view">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </ToggleButton>
          <ToggleButton value="table" aria-label="table view">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 5h18M3 12h18M3 19h18"/></svg>
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div> : null}

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({length: 6}).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <Skeleton variant="rectangular" height={220} animation="wave" />
                <div className="p-4">
                  <Skeleton variant="text" width="70%" animation="wave" />
                  <Skeleton variant="text" width="40%" animation="wave" />
                </div>
              </div>
            ))
          ) : rows.length ? (
            rows.map(r => {
              const poster = r.thumbnailUrl || parseVideo(r.videoUrl).poster;
              const p = r.property;
              return (
                <div key={r.id} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
                  <div className="relative h-56 w-full cursor-pointer bg-ink" onClick={() => setPreview(r)}>
                    {poster ? <img src={poster} alt="" className="h-full w-full object-cover" /> : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute inset-0 grid place-items-center text-white/90 transition-transform group-hover:scale-110">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </span>
                    {r.isBoosted && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-ink">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>Boosted
                      </span>
                    )}
                    <div className="absolute right-2 top-2" onClick={e => e.stopPropagation()}>
                      <IconButton size="small" disabled={busy === r.id} onClick={e => openMenu(e, r)} sx={{backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': {backgroundColor: '#fff'}}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#11111b" strokeWidth="2"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
                      </IconButton>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="truncate text-[13px] font-medium">{r.caption || <span className="text-white/60">No caption</span>}</span>
                      <span className="shrink-0 text-[11px] text-white/70">{fmtDate(r.createdAt)}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-[13px] font-medium text-fg">{r.agent?.fullName || '—'}</div>
                    <div className="text-[11.5px] text-muted">{r.agent?.email || ''}</div>

                    <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-[12px] text-muted">
                      <span className="inline-flex items-center gap-1.5"><Svg d={I.eye} />{fmtCount(r.viewCount)}</span>
                      <span className="inline-flex items-center gap-1.5"><Svg d={I.heart} />{r.likeCount}</span>
                      <span className="inline-flex items-center gap-1.5"><Svg d={I.comment} />{r.commentCount}</span>
                    </div>

                    {p && (
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/properties/${p.id}`)}
                        className="group/p mt-3 flex w-full items-start gap-3 rounded-xl border border-line bg-bg p-2.5 text-left transition hover:border-gold/50 hover:bg-gold/5">
                        {p.imageUrls?.[0] ? (
                          <img src={p.imageUrls[0]} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg border border-line bg-surface"><Svg d={I.home} size={16} /></div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-semibold text-fg group-hover/p:text-gold-dark">↳ {p.title}</div>
                          <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                            {p.description || 'No description provided.'}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-gold-dark">{money(p.price, p.currency)}</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-line bg-surface py-12 text-center text-muted">No reels match these filters.</div>
          )}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {view === 'table' && (
      <TableContainer component={Paper} variant="outlined" sx={{borderColor: '#e2e4eb', borderRadius: '16px', overflow: 'hidden'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>Reel</TableCell>
              <TableCell sx={headSx}>Agent</TableCell>
              <TableCell sx={headSx}>Views</TableCell>
              <TableCell sx={headSx}>Likes</TableCell>
              <TableCell sx={headSx}>Comments</TableCell>
              <TableCell sx={headSx}>Boost</TableCell>
              <TableCell sx={headSx}>Posted</TableCell>
              <TableCell sx={headSx} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({length: 6}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell sx={cellSx}><div className="flex items-center gap-3"><Skeleton variant="rounded" width={40} height={54} animation="wave" /><Skeleton variant="text" width={160} animation="wave" /></div></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={110} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={36} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={30} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={30} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="rounded" width={64} height={20} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={80} animation="wave" /></TableCell>
                  <TableCell sx={cellSx} align="right"><Skeleton variant="circular" width={28} height={28} animation="wave" sx={{ml: 'auto'}} /></TableCell>
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell sx={cellSx}>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setPreview(r)} className="relative h-[54px] w-10 shrink-0 overflow-hidden rounded-md border border-line bg-ink">
                        {(r.thumbnailUrl || parseVideo(r.videoUrl).poster) ? <img src={r.thumbnailUrl || parseVideo(r.videoUrl).poster} alt="" className="h-full w-full object-cover" /> : null}
                        <span className="absolute inset-0 grid place-items-center text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
                      </button>
                      <div className="min-w-0 max-w-[260px]">
                        <div className="truncate text-[13.5px] font-medium text-fg">{r.caption || <span className="text-muted">No caption</span>}</div>
                        {r.property && <div className="truncate text-[11.5px] text-gold-dark">↳ {r.property.title}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <div className="text-[13px] font-medium text-fg">{r.agent?.fullName || '—'}</div>
                    <div className="text-[11.5px] text-muted">{r.agent?.email || ''}</div>
                  </TableCell>
                  <TableCell sx={cellSx}><span className="text-sm font-semibold text-fg">{fmtCount(r.viewCount)}</span></TableCell>
                  <TableCell sx={cellSx}><span className="text-sm text-fg">{r.likeCount}</span></TableCell>
                  <TableCell sx={cellSx}><span className="text-sm text-fg">{r.commentCount}</span></TableCell>
                  <TableCell sx={cellSx}>
                    {r.isBoosted
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-dark"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>Boosted</span>
                      : <span className="text-sm text-muted">—</span>}
                  </TableCell>
                  <TableCell sx={cellSx}><span className="text-sm text-muted">{fmtDate(r.createdAt)}</span></TableCell>
                  <TableCell sx={cellSx} align="right">
                    <IconButton size="small" disabled={busy === r.id} onClick={e => openMenu(e, r)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636274" strokeWidth="2"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell sx={{...cellSx, borderBottom: 'none'}} colSpan={8}><div className="py-12 text-center text-muted">No reels match these filters.</div></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={closeMenu} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} transformOrigin={{vertical: 'top', horizontal: 'right'}}>
        <MenuItem onClick={() => { const r = menu.row; closeMenu(); setPreview(r); }} sx={{fontSize: 14}}>Preview</MenuItem>
        <MenuItem onClick={() => remove(menu.row.id)} sx={{fontSize: 14, color: '#e0654f'}}>Delete</MenuItem>
      </Menu>

      {!loading && total > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        </div>
      )}

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="xs" fullWidth sx={{'& .MuiPaper-root': {borderRadius: '16px', overflow: 'hidden', background: '#000'}}}>
        {preview && (parseVideo(preview.videoUrl).provider === 'file' ? (
          <video src={preview.videoUrl} poster={preview.thumbnailUrl} controls autoPlay style={{width: '100%', maxHeight: '80vh', display: 'block'}} />
        ) : (
          <iframe title="reel" src={embedSrc(parseVideo(preview.videoUrl))} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{width: '100%', aspectRatio: '9 / 16', maxHeight: '80vh', border: 0, display: 'block'}} />
        ))}
      </Dialog>
    </ThemeProvider>
  );
}
