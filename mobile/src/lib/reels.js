import {api} from './api';

/** Create a new reel (agent/admin only). */
export async function createReel({videoUrl, thumbnailUrl, caption, propertyId}) {
  const {data} = await api.post('/reels', {
    videoUrl,
    ...(thumbnailUrl ? {thumbnailUrl} : {}),
    ...(caption ? {caption} : {}),
    ...(propertyId ? {propertyId} : {}),
  });
  return data;
}

/** Public reels feed (vertical video). */
export async function fetchReelFeed(params = {}) {
  const {data} = await api.get('/reels/feed', {params});
  return data; // {items, page, limit, total, hasMore}
}

/** Fire-and-forget view counter. */
export function markReelViewed(id) {
  return api.post(`/reels/${id}/view`).catch(() => {});
}

export async function likeReel(id) {
  const {data} = await api.post(`/reels/${id}/like`);
  return data;
}

export async function unlikeReel(id) {
  const {data} = await api.delete(`/reels/${id}/like`);
  return data;
}

export async function fetchComments(reelId) {
  const {data} = await api.get(`/reels/${reelId}/comments`);
  return data; // [{id, text, user:{fullName,avatarUrl}, createdAt}]
}

export async function addComment(reelId, text) {
  const {data} = await api.post(`/reels/${reelId}/comments`, {text});
  return data;
}

export async function deleteComment(commentId) {
  const {data} = await api.delete(`/reels/comments/${commentId}`);
  return data;
}
