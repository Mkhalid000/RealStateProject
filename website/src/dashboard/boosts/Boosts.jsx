import {useCallback, useEffect, useState} from 'react';
import {apiFetch} from '../../lib/api';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}) : '—');
const fmtAmt  = n => `$${Number(n || 0).toFixed(2)}`;

const muiTheme = createTheme({
  palette: {primary: {main: '#f2a65a', dark: '#d98a3e', contrastText: '#211d1d'}, text: {primary: '#11111b', secondary: '#636274'}},
  typography: {fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13},
  shape: {borderRadius: 9},
  components: {MuiButton: {styleOverrides: {root: {textTransform: 'none', fontWeight: 600, boxShadow: 'none'}}}},
});

const headSx = {backgroundColor: '#f8f9fb', color: '#8a8d99', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #e2e4eb', py: 1.5};
const cellSx = {borderBottom: '1px solid #f0f1f5', py: 1.5};

const STATUS = {
  active:  {cls: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500'},
  pending: {cls: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-400'},
  expired: {cls: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400'},
};

export default function Boosts() {
  const [rows, setRows]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/admin/boosts')
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runExpiry() {
    setBusy(true);
    try {
      await apiFetch('/admin/boosts/expire', {method: 'POST'});
      load();
    } finally {
      setBusy(false);
    }
  }

  const active  = rows.filter(b => b.status === 'active').length;
  const revenue = rows.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  return (
    <ThemeProvider theme={muiTheme}>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">Boosts</div>
          <p className="mt-0.5 text-sm text-muted">Track active promotions and boost revenue</p>
        </div>
        <Button
          variant="contained"
          onClick={runExpiry}
          disabled={busy}
          startIcon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>
            </svg>
          }>
          {busy ? 'Running…' : 'Run Expiry Sweep'}
        </Button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div>
      ) : null}

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-3 gap-4">
        <SummaryCard label="Total Boosts" value={rows.length} icon="layers" color="#f2a65a" />
        <SummaryCard label="Active Now"   value={active}      icon="zap"    color="#10b981" />
        <SummaryCard label="Total Revenue" value={`$${revenue.toFixed(2)}`} icon="dollar" color="#8b5cf6" />
      </div>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{borderColor: '#e2e4eb', borderRadius: '16px', overflow: 'hidden'}}>
        <Table sx={{'& td, & th': {borderColor: '#f0f1f5'}}}>
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>Agent</TableCell>
              <TableCell sx={headSx}>Amount</TableCell>
              <TableCell sx={headSx}>Days</TableCell>
              <TableCell sx={headSx}>Status</TableCell>
              <TableCell sx={headSx}>Expires</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({length: 5}).map((_, i) => (
                <TableRow key={i}>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={160} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={70} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={40} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="rounded" width={80} height={24} animation="wave" /></TableCell>
                  <TableCell sx={cellSx}><Skeleton variant="text" width={100} animation="wave" /></TableCell>
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map(b => {
                const st = STATUS[b.status] || STATUS.pending;
                return (
                  <TableRow key={b.id} hover>
                    <TableCell sx={cellSx}>
                      <div className="flex flex-col">
                        <span className="text-[13.5px] font-semibold text-fg">{b.agent?.fullName || '—'}</span>
                        <span className="text-xs text-muted">{b.agent?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <span className="font-semibold text-fg">{fmtAmt(b.amount)}</span>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <span className="text-sm text-muted">{b.days ?? '—'} days</span>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${st.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <span className="text-sm text-muted">{fmtDate(b.expiresAt || b.boostExpiresAt)}</span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell sx={{...cellSx, borderBottom: 'none'}} colSpan={5}>
                  <div className="py-10 text-center text-muted">No boosts found.</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </ThemeProvider>
  );
}

function SummaryCard({label, value, icon, color}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{background: `${color}15`, color}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {icon === 'layers' && <><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></>}
            {icon === 'zap'    && <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>}
            {icon === 'dollar' && <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
          </svg>
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-fg">{value}</div>
    </div>
  );
}
