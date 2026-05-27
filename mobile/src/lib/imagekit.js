import {api} from './api';

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

/**
 * Signed client upload to ImageKit. The backend signs the request (token,
 * expire, signature via the private key); the file goes DIRECTLY to ImageKit.
 */
async function upload(uri, folder, fileName, mimeType) {
  // 1) get auth params from our backend
  const {data: auth} = await api.get('/uploads/signature');

  // 2) upload straight to ImageKit
  const form = new FormData();
  form.append('file', {uri, type: mimeType, name: fileName});
  form.append('fileName', fileName);
  form.append('publicKey', auth.publicKey);
  form.append('signature', auth.signature);
  form.append('expire', String(auth.expire));
  form.append('token', auth.token);
  form.append('folder', folder);
  form.append('useUniqueFileName', 'true');

  const res = await fetch(UPLOAD_URL, {method: 'POST', body: form});
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImageKit upload failed (${res.status}): ${text}`);
  }
  const result = await res.json();

  // ImageKit returns a thumbnailUrl for images; for video we derive one.
  const isVideo = mimeType.startsWith('video');
  const thumbnailUrl = isVideo
    ? `${result.url}/ik-thumbnail.jpg`
    : result.thumbnailUrl || result.url;

  return {
    url: result.url,
    fileId: result.fileId,
    thumbnailUrl,
  };
}

export function uploadVideo(uri) {
  return upload(uri, 'reels', `reel_${Date.now()}.mp4`, 'video/mp4');
}

export function uploadImage(uri, name) {
  return upload(uri, 'images', name || `img_${Date.now()}.jpg`, 'image/jpeg');
}
