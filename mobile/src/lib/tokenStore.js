import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS = 'rr_access';
const REFRESH = 'rr_refresh';

export const tokenStore = {
  async get() {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(ACCESS),
      AsyncStorage.getItem(REFRESH),
    ]);
    if (!accessToken || !refreshToken) {
      return null;
    }
    return {accessToken, refreshToken};
  },
  async set(tokens) {
    await Promise.all([
      AsyncStorage.setItem(ACCESS, tokens.accessToken),
      AsyncStorage.setItem(REFRESH, tokens.refreshToken),
    ]);
  },
  async clear() {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS),
      AsyncStorage.removeItem(REFRESH),
    ]);
  },
};
