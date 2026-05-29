import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {parseVideo, embedSrc} from '../../lib/video';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Skeleton from '@mui/material/Skeleton';

const muiTheme = createTheme({
  palette: {primary: {main: '#f2a65a', dark: '#d98a3e', contrastText: '#211d1d'}, text: {primary: '#11111b', secondary: '#636274'}},
  typography: {fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13},
  shape: {borderRadius: 9},
  components: {MuiButton: {styleOverrides: {root: {textTransform: 'none', fontWeight: 600, boxShadow: 'none'}}}},
});

const BOOST_OPTS = [7, 14, 30];
const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-US', {day: '2-digit', month: 'short'}) : '');
const fmtCount = n => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n ?? 0));

export default function AgentReels() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState(null); // reel being previewed
  const [boostReel, setBoostReel] = useState(null); // reel being boosted
  const [commentsReel, setCommentsReel] = useState(null); // reel whose comments are open

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/reels/mine?limit=50')
      .then(r => setRows(r.items || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    if (!confirm('Delete this reel? This cannot be undone.')) return;
    setBusy(id);
    try {
      await apiFetch(`/reels/${id}`, {method: 'DELETE'});
      load();
    } finally { setBusy(null); }
  }

  async function boost(reelId, days) {
    setBusy(reelId);
    setBoostReel(null);
    try {
      await apiFetch('/billing/boosts', {method: 'POST', body: JSON.stringify({reelId, days})});
      load();
    } catch (e) {
      setError(e.message);
    } finally { setBusy(null); }
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="text-2xl font-bold tracking-tight text-fg">My Reels</div>
          <p className="mt-0.5 text-sm text-muted">Upload property videos, manage and boost them in the feed</p>
        </div>
        <Button variant="contained" component={Link} to="/agent/reels/new"
          startIcon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>}>
          New Reel
        </Button>
      </div>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div> : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <Skeleton variant="rectangular" sx={{paddingTop: '140%'}} animation="wave" />
              <div className="p-3"><Skeleton variant="text" animation="wave" /><Skeleton variant="text" width="50%" animation="wave" /></div>
            </div>
          ))}
        </div>
      ) : rows.length ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map(r => (
            <div key={r.id} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:shadow-md">
              {/* media */}
              <button type="button" onClick={() => setPreview(r)} className="relative block aspect-[3/4] w-full bg-ink">
                {(r.thumbnailUrl || parseVideo(r.videoUrl).poster) ? (
                  <img src={r.thumbnailUrl || parseVideo(r.videoUrl).poster} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
                ) : (
                  <div className="grid h-full place-items-center bg-gradient-to-br from-[#211d1d] to-[#3a3434]">
                    <span className="font-serif text-lg tracking-wide text-white">AU<span className="text-gold">REVIA</span></span>
                  </div>
                )}
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition group-hover:scale-110">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </span>
                </span>
                {r.isBoosted && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10.5px] font-bold text-ink">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>
                    Boosted
                  </span>
                )}
                <span className="absolute bottom-2 left-2 right-2 flex items-center gap-3 text-[11px] font-semibold text-white drop-shadow">
                  <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>{fmtCount(r.viewCount)}</span>
                  <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z"/></svg>{r.likeCount}</span>
                  <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{r.commentCount}</span>
                </span>
              </button>

              {/* body */}
              <div className="p-3">
                <p className="line-clamp-2 min-h-[34px] text-xs text-fg">{r.caption || <span className="text-muted">No caption</span>}</p>
                {r.property && (
                  <Link to={`/admin/properties/${r.property.id}`} className="mt-1 block truncate text-[11px] font-medium text-gold-dark hover:underline">
                    ↳ {r.property.title}
                  </Link>
                )}
                {r.isBoosted && r.boostExpiresAt && (
                  <div className="mt-1 text-[10.5px] text-muted">Boost ends {fmtDate(r.boostExpiresAt)}</div>
                )}
                <button type="button" onClick={() => setCommentsReel(r)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-gold-dark hover:underline">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  View {r.commentCount} comment{r.commentCount === 1 ? '' : 's'}
                </button>
                <div className="mt-2 flex gap-2">
                  <Button size="small" variant="outlined" color="inherit" fullWidth disabled={busy === r.id}
                    onClick={() => setBoostReel(r)}
                    sx={{borderColor: '#e2e4eb', fontSize: 12}}>
                    {r.isBoosted ? 'Extend' : 'Boost'}
                  </Button>
                  <Button size="small" variant="outlined" disabled={busy === r.id}
                    onClick={() => remove(r.id)}
                    sx={{borderColor: 'rgba(224,101,79,0.4)', color: '#e0654f', minWidth: 40, fontSize: 12}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface py-16 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-bg text-muted">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>
          </div>
          <p className="text-muted">You haven't posted any reels yet.</p>
          <Button variant="contained" component={Link} to="/agent/reels/new" sx={{mt: 2}}>Create your first reel</Button>
        </div>
      )}

      {/* preview dialog */}
      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="xs" fullWidth
        sx={{'& .MuiPaper-root': {borderRadius: '16px', overflow: 'hidden', background: '#000'}}}>
        {preview && (parseVideo(preview.videoUrl).provider === 'file' ? (
          <video src={preview.videoUrl} poster={preview.thumbnailUrl} controls autoPlay style={{width: '100%', maxHeight: '80vh', display: 'block'}} />
        ) : (
          <iframe title="reel" src={embedSrc(parseVideo(preview.videoUrl))} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{width: '100%', aspectRatio: '9 / 16', maxHeight: '80vh', border: 0, display: 'block'}} />
        ))}
      </Dialog>

      {/* boost dialog */}
      <Dialog open={Boolean(boostReel)} onClose={() => setBoostReel(null)} maxWidth="xs" fullWidth
        sx={{'& .MuiPaper-root': {borderRadius: '16px'}}}>
        <DialogTitle sx={{fontWeight: 700}}>Boost this reel</DialogTitle>
        <DialogContent sx={{pb: 3}}>
          <p style={{fontSize: 13, color: '#636274', marginBottom: 16}}>
            Boosted reels appear first in the public feed. Choose a duration ($10 per 7 days).
          </p>
          <div style={{display: 'grid', gap: 10}}>
            {BOOST_OPTS.map(d => (
              <Button key={d} variant="outlined" color="inherit" fullWidth disabled={busy === boostReel?.id}
                onClick={() => boost(boostReel.id, d)}
                sx={{borderColor: '#e2e4eb', justifyContent: 'space-between', px: 2, py: 1.2}}>
                <span style={{fontWeight: 600}}>{d} days</span>
                <span style={{color: '#d98a3e', fontWeight: 700}}>${((d / 7) * 10).toFixed(0)}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* comments dialog */}
      {commentsReel && (
        <CommentsDialog
          reel={commentsReel}
          onClose={() => setCommentsReel(null)}
          onPosted={() => setRows(prev => prev.map(x => (x.id === commentsReel.id ? {...x, commentCount: x.commentCount + 1} : x)))}
        />
      )}
    </ThemeProvider>
  );
}

function CommentsDialog({reel, onClose, onPosted}) {
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    apiFetch(`/reels/${reel.id}/comments`).then(setList).catch(() => setList([]));
  }, [reel.id]);

  async function post(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const c = await apiFetch(`/reels/${reel.id}/comments`, {method: 'POST', body: JSON.stringify({text: text.trim()})});
      setList(prev => [c, ...(prev || [])]);
      setText('');
      onPosted();
    } finally {
      setPosting(false);
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth sx={{'& .MuiPaper-root': {borderRadius: '16px'}}}>
      <DialogTitle sx={{fontWeight: 700, fontSize: 16}}>Comments{list ? ` · ${list.length}` : ''}</DialogTitle>
      <DialogContent sx={{px: 2.5, pb: 2}}>
        <div style={{maxHeight: '46vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8}}>
          {!list ? (
            <p style={{fontSize: 13, color: '#a0a3b1'}}>Loading…</p>
          ) : list.length ? (
            list.map(c => (
              <div key={c.id} style={{display: 'flex', gap: 10}}>
                <span style={{display: 'grid', placeItems: 'center', height: 32, width: 32, flexShrink: 0, borderRadius: '50%', background: '#f5f6fa', color: '#636274', fontWeight: 700, fontSize: 12}}>
                  {(c.user?.fullName || 'U').charAt(0).toUpperCase()}
                </span>
                <div>
                  <div style={{fontSize: 12.5, fontWeight: 600, color: '#11111b'}}>{c.user?.fullName || 'User'}</div>
                  <div style={{fontSize: 13.5, color: '#3a3a44'}}>{c.text}</div>
                </div>
              </div>
            ))
          ) : (
            <p style={{fontSize: 13, color: '#a0a3b1'}}>No comments yet.</p>
          )}
        </div>
        <form onSubmit={post} style={{display: 'flex', gap: 8, borderTop: '1px solid #f0f1f5', paddingTop: 12, marginTop: 4}}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Reply to your viewers…"
            style={{flex: 1, border: '1px solid #e2e4eb', borderRadius: 999, padding: '8px 14px', fontSize: 13, outline: 'none'}} />
          <Button type="submit" variant="contained" disabled={posting} size="small">Post</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
