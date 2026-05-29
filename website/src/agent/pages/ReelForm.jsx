import {useEffect, useRef, useState} from 'react';
import {useNavigate, useLocation, Link} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {uploadFile} from '../../lib/upload';
import {parseVideo, embedSrc} from '../../lib/video';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

const muiTheme = createTheme({
  palette: {primary: {main: '#f2a65a', dark: '#d98a3e', contrastText: '#211d1d'}, text: {primary: '#11111b', secondary: '#636274'}},
  typography: {fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13},
  shape: {borderRadius: 9},
  components: {
    MuiOutlinedInput: {styleOverrides: {root: {backgroundColor: '#fff', '& fieldset': {borderColor: '#e2e4eb'}}}},
    MuiButton: {styleOverrides: {root: {textTransform: 'none', fontWeight: 600, boxShadow: 'none'}}},
  },
});

export default function ReelForm() {
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const base = pathname.startsWith('/admin') ? '/admin/reels' : '/agent/reels';
  const backLabel = pathname.startsWith('/admin') ? 'Reels' : 'My Reels';
  const [source, setSource] = useState('upload'); // 'upload' | 'url'
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [myProps, setMyProps] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    apiFetch('/properties/mine?limit=100')
      .then(r => setMyProps(r.items || []))
      .catch(() => {});
  }, []);

  async function handleVideo(file) {
    if (!file) return;
    if (!file.type.startsWith('video/')) return setError('Please choose a video file.');
    setError('');
    setUploading(true);
    try {
      const r = await uploadFile(file, 'reels');
      setVideoUrl(r.url);
      if (r.thumbnailUrl) setThumbnailUrl(r.thumbnailUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleThumb(file) {
    if (!file) return;
    setUploading(true);
    try {
      const r = await uploadFile(file, 'reel-thumbs');
      setThumbnailUrl(r.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!videoUrl.trim()) return setError('Add a video — upload a file or paste a URL.');
    setSaving(true);
    setError('');
    try {
      await apiFetch('/reels', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          caption: caption.trim() || undefined,
          propertyId: propertyId || undefined,
        }),
      });
      navigate(base);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="mx-auto">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted">
          <Link to={base} className="hover:text-gold-dark">{backLabel}</Link>
          <span>›</span>
          <span className="text-fg">New Reel</span>
        </div>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* left: inputs */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-muted">Video</span>
                <div className="inline-flex rounded-full bg-bg p-0.5 text-xs font-semibold">
                  {['upload', 'url'].map(s => (
                    <button key={s} type="button" onClick={() => setSource(s)}
                      className={`rounded-full px-3 py-1 capitalize transition ${source === s ? 'bg-gold text-ink' : 'text-muted hover:text-fg'}`}>
                      {s === 'url' ? 'Paste URL' : 'Upload'}
                    </button>
                  ))}
                </div>
              </div>

              {source === 'upload' ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleVideo(e.dataTransfer.files?.[0]); }}
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${dragOver ? 'border-gold bg-gold/5' : 'border-line bg-bg'}`}>
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface text-muted">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-fg">{uploading ? 'Uploading…' : 'Drag & drop a video, or click to browse'}</p>
                  <p className="mt-1 text-xs text-muted">MP4 / WebM / MOV</p>
                  <input ref={fileRef} type="file" accept="video/*" hidden onChange={e => handleVideo(e.target.files?.[0])} />
                </div>
              ) : (
                <div className="space-y-3">
                  <TextField size="small" fullWidth label="Video URL" placeholder="YouTube, Vimeo, or a direct .mp4 link"
                    helperText="YouTube/Vimeo links embed automatically; direct files play inline."
                    value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                  <TextField size="small" fullWidth label="Thumbnail URL (optional)" placeholder="https://…/cover.jpg"
                    value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} />
                </div>
              )}

              {videoUrl && source === 'upload' && (
                <p className="mt-3 truncate text-xs text-emerald-600">✓ Video ready</p>
              )}
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <TextField size="small" fullWidth multiline minRows={3} label="Caption"
                placeholder="Write a caption for your reel…" value={caption} onChange={e => setCaption(e.target.value)} />
              <div className="mt-4">
                <TextField select size="small" fullWidth label="Link a property (optional)" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {myProps.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                  ))}
                </TextField>
              </div>
            </div>

            {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</div> : null}

            <div className="flex justify-end gap-2.5">
              <Button variant="outlined" color="inherit" component={Link} to={base} sx={{borderColor: '#e2e4eb'}}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving || uploading}>{saving ? 'Publishing…' : 'Publish Reel'}</Button>
            </div>
          </div>

          {/* right: live preview */}
          <div>
            <div className="sticky top-4">
              <p className=" text-xs font-semibold uppercase tracking-wider text-muted">Preview</p>
              <div className="mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl border border-line bg-ink">
                {videoUrl && parseVideo(videoUrl).provider !== 'file' ? (
                  <iframe title="preview" src={embedSrc(parseVideo(videoUrl), {autoplay: false})} allow="encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" style={{border: 0}} />
                ) : videoUrl ? (
                  <video src={videoUrl} poster={thumbnailUrl} controls className="h-full w-full object-cover" />
                ) : thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-white/40">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>
                  </div>
                )}
              </div>
              {source === 'upload' && (
                <button type="button" onClick={() => document.getElementById('thumb-input')?.click()}
                  className="mt-3 w-full rounded-lg border border-line bg-surface py-2 text-xs font-semibold text-muted transition hover:border-gold hover:text-gold-dark">
                  {thumbnailUrl ? 'Change thumbnail' : 'Upload custom thumbnail'}
                </button>
              )}
              <input id="thumb-input" type="file" accept="image/*" hidden onChange={e => handleThumb(e.target.files?.[0])} />
            </div>
          </div>
        </form>
      </div>
    </ThemeProvider>
  );
}
