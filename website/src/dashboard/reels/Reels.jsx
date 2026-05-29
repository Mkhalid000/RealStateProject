import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';
import {parseVideo, embedSrc} from '../../lib/video';
import {createTheme, ThemeProvider} from '@mui/material/styles';
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

const LIMIT = 10;
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}) : '—');
const fmtCount = n => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n ?? 0));

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
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
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
          <p className="mt-0.5 text-sm text-muted">Moderate the property reels feed</p>
        </div>
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
      </div>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div> : null}

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
