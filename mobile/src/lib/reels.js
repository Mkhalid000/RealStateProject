import {api} from './api';

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
