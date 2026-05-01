import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY  = 'neotravel_access';
const REFRESH_KEY = 'neotravel_refresh';

export const saveTokens   = async (access, refresh) => {
  await SecureStore.setItemAsync(ACCESS_KEY,  access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
};
export const getToken     = () => SecureStore.getItemAsync(ACCESS_KEY);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);
export const removeTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
};

// Legacy aliases
export const saveToken   = (t) => SecureStore.setItemAsync(ACCESS_KEY, t);
export const removeToken = ()  => removeTokens();
