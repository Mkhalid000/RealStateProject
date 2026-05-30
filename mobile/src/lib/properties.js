import {api} from './api';

/** Public, paginated listing feed. `params` mirrors QueryPropertiesDto. */
export async function fetchProperties(params = {}) {
  const {data} = await api.get('/properties', {params});
  return data; // {items, page, limit, total, hasMore}
}

export async function fetchProperty(idOrSlug) {
  const {data} = await api.get(`/properties/${idOrSlug}`);
  return data;
}

/** Listings the signed-in user/agent owns. */
export async function fetchMyProperties(params = {}) {
  const {data} = await api.get('/properties/mine', {params});
  return data;
}

export async function fetchSavedProperties() {
  const {data} = await api.get('/properties/saved/mine');
  return data; // array OR {items}
}

export async function createProperty(payload) {
  const {data} = await api.post('/properties', payload);
  return data;
}

export async function deleteProperty(id) {
  const {data} = await api.delete(`/properties/${id}`);
  return data;
}

export async function saveProperty(id) {
  const {data} = await api.post(`/properties/${id}/save`);
  return data;
}

export async function unsaveProperty(id) {
  const {data} = await api.delete(`/properties/${id}/save`);
  return data;
}
