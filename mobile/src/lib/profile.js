import {api} from './api';

/** GET the signed-in user's full profile (includes email). */
export async function getMyProfile() {
  const {data} = await api.get('/profiles/me');
  return data;
}

/**
 * PATCH the signed-in user's profile. Pass only the fields you want to change
 * — fullName, bio, avatarUrl, phone, socialLinks. Returns the updated profile.
 */
export async function updateMyProfile(payload) {
  const {data} = await api.patch('/profiles/me', payload);
  return data;
}
