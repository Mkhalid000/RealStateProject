import AsyncStorage from '@react-native-async-storage/async-storage';
import {api} from './api';
import {tokenStore} from './tokenStore';
import {useSavedStore} from '../store/savedStore';

export async function register({email, password, fullName, role, phone, agencyName}) {
  const {data} = await api.post('/auth/register', {
    email,
    password,
    fullName,
    role,
    ...(phone ? {phone} : {}),
    ...(agencyName ? {agencyName} : {}),
  });
  // Agent accounts need admin approval — no tokens/user are issued yet.
  if (data.pendingVerification) {
    return {pendingVerification: true, message: data.message};
  }
  await tokenStore.set(data.tokens);
  return data.user;
}

export async function login(email, password) {
  const {data} = await api.post('/auth/login', {email, password});
  await tokenStore.set(data.tokens);
  return data.user;
}

export async function logout() {
  const tokens = await tokenStore.get();
  try {
    await api.post('/auth/logout', {refreshToken: tokens?.refreshToken});
  } catch {
    // ignore network errors on logout
  }
  await tokenStore.clear();
  await AsyncStorage.multiRemove([
    'rr_last_user',
    '@ai_chat_sessions',
    '@recent_properties',
    '@saved_searches',
  ]).catch(() => {});
  useSavedStore.getState().reset();
}

export async function fetchMe() {
  const {data} = await api.get('/auth/me');
  return data;
}
