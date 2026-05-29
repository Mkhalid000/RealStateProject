import {useCallback, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
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
const STATUSES = ['new', 'contacted', 'closed'];
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}) : '—');

const STATUS_CLS = {
  new: 'bg-amber-50 text-amber-600',
  contacted: 'bg-blue-50 text-blue-600',
  closed: 'bg-emerald-50 text-emerald-600',
};

const muiTheme = createTheme({
  palette: {primary: {main: '#f2a65a', dark: '#d98a3e', contrastText: '#211d1d'}, text: {primary: '#11111b', secondary: '#636274'}},
  typography: {fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13},
  shape: {borderRadius: 9},
  components: {MuiOutlinedInput: {styleOverrides: {root: {backgroundColor: '#fff', '& fieldset': {borderColor: '#e2e4eb'}}}}},
});

const headSx = {backgroundColor: '#f8f9fb', color: '#8a8d99', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #e2e4eb', py: 1.5};
const cellSx = {borderBottom: '1px solid #f0f1f5', py: 1.5, verticalAlign: 'top'};

export default function Leads() {
  const {source = 'website'} = useParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => { setPage(1); }, [source, status]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({source, page: String(page), limit: String(LIMIT)});
    if (status !== 'all') params.set('status', status);
    apiFetch(`/leads?${params.toString()}`)
      .then(r => { setRows(r.items || []); setTotal(r.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [source, page, status]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id, value) {
    setBusy(id);
    try {
      await apiFetch(`/leads/${id}/status`, {method: 'PATCH', body: JSON.stringify({status: value})});
      load();
    } finally { setBusy(null); }
  }

  async function remove(id) {
    if (!confirm('Delete this lead?')) return;
    setBusy(id);
    try {
      await apiFetch(`/leads/${id}`, {method: 'DELETE'});
      load();
    } finally { setBusy(null); }
  }

  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);
  const isMobile = source === 'mobile';
  const title = isMobile ? 'Mobile Leads' : 'Website Leads';

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">{title}</div>
          <p className="mt-0.5 text-sm text-muted">
            {isMobile ? 'Enquiries captured from the mobile app' : 'Enquiries submitted from property pages on the website'}
          </p>
        </div>
        <TextField select size="small" label="Status" value={status} onChange={e => setStatus(e.target.value)} sx={{minWidth: 150}}>
          <MenuItem value="all">All statuses</MenuItem>
          {STATUSES.map(s => <MenuItem key={s} value={s} sx={{textTransform: 'capitalize'}}>{s}</MenuItem>)}
        </TextField>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div> : null}

      <TableContainer component={Paper} variant="outlined" sx={{borderColor: '#e2e4eb', borderRadius: '16px', overflow: 'hidden'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>Lead</TableCell>
              <TableCell sx={headSx}>Property</TableCell>
              <TableCell sx={headSx}>Message</TableCell>
              <TableCell sx={headSx}>Status</TableCell>
              <TableCell sx={headSx}>Received</TableCell>
              <TableCell sx={headSx} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({length: 6}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={140} animation="wave" /><Skeleton variant="text" width={170} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={120} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={200} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="rounded" width={110} height={32} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={80} animation="wave" /></TableCell>
                  <TableCell sx={cellSx} align="right"><Skeleton variant="circular" width={28} height={28} animation="wave" sx={{ml: 'auto'}} /></TableCell>
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map(l => (
                <TableRow key={l.id} hover>
                  <TableCell sx={cellSx}>
                    <div className="font-semibold text-fg">{l.name}</div>
                    <div className="text-xs text-muted">{[l.email, l.phone].filter(Boolean).join(' · ') || '—'}</div>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    {l.property ? (
                      <Link to={`/admin/properties/${l.property.id}`} className="text-sm font-medium text-gold-dark hover:underline">
                        {l.property.title}
                      </Link>
                    ) : <span className="text-sm text-muted">—</span>}
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <span className="block max-w-[280px] text-sm text-fg/80" title={l.message || ''}>{l.message || '—'}</span>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <TextField select size="small" value={l.status} disabled={busy === l.id} onChange={e => changeStatus(l.id, e.target.value)} sx={{minWidth: 130}}>
                      {STATUSES.map(s => <MenuItem key={s} value={s} sx={{textTransform: 'capitalize'}}>{s}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  <TableCell sx={cellSx}><span className="text-sm text-muted">{fmtDate(l.createdAt)}</span></TableCell>
                  <TableCell sx={cellSx} align="right">
                    <IconButton size="small" disabled={busy === l.id} onClick={() => remove(l.id)} sx={{color: '#e0654f'}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell sx={{...cellSx, borderBottom: 'none'}} colSpan={6}>
                  <div className="py-12 text-center text-muted">
                    {isMobile ? 'No mobile leads yet — they will appear here once the mobile app submits enquiries.' : 'No website leads yet.'}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && total > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        </div>
      )}
    </ThemeProvider>
  );
}
