import {apiFetch} from './api';

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

/**
 * Uploads a browser File directly to ImageKit (backend signs the request).
 * Returns { url, thumbnailUrl, fileId, name }.
 */
export async function uploadFile(file, folder = 'properties') {
  const auth = await apiFetch('/uploads/signature');

  const form = new FormData();
  form.append('file', file);
  form.append('fileName', file.name);
  form.append('publicKey', auth.publicKey);
  form.append('signature', auth.signature);
  form.append('expire', String(auth.expire));
  form.append('token', auth.token);
  form.append('folder', folder);
  form.append('useUniqueFileName', 'true');

  const res = await fetch(UPLOAD_URL, {method: 'POST', body: form});
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  const r = await res.json();
  return {url: r.url, thumbnailUrl: r.thumbnailUrl || r.url, fileId: r.fileId, name: r.name};
}
