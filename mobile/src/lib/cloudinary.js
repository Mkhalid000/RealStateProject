import {api} from './api';

/**
 * Signed direct upload: the backend signs the request, the client uploads the
 * file straight to Cloudinary (no media passes through our server).
 */
async function upload(uri, kind, folder, fileName, mimeType) {
  const {data: sig} = await api.get('/uploads/signature', {params: {folder}});

  const form = new FormData();
  form.append('file', {uri, type: mimeType, name: fileName});
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${kind}/upload`;
  const res = await fetch(endpoint, {method: 'POST', body: form});
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed (${res.status})`);
  }
  const result = await res.json();

  const thumbnailUrl =
    kind === 'video'
      ? `https://res.cloudinary.com/${sig.cloudName}/video/upload/so_0,w_640,c_fill/${result.public_id}.jpg`
      : result.secure_url;

  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbnailUrl,
    durationSec: result.duration,
  };
}

export function uploadVideo(uri) {
  return upload(uri, 'video', 'reels', 'reel.mp4', 'video/mp4');
}

export function uploadImage(uri, name = 'image.jpg') {
  return upload(uri, 'image', 'images', name, 'image/jpeg');
}
