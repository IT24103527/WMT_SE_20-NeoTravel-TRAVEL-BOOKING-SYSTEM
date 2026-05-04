import axios from 'axios';
import { getToken, getRefreshToken, saveTokens, removeTokens } from '../utils/storage';

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.211:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach access token to every request
axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code     = error.response?.data?.code;

    if (error.response?.status === 401 && code === 'TOKEN_EXPIRED' && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const refresh = await getRefreshToken();
        const { data } = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/refresh`,
          { refreshToken: refresh }
        );
        await saveTokens(data.data.accessToken, data.data.refreshToken);
        processQueue(null, data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axiosInstance(original);
      } catch (err) {
        processQueue(err, null);
        await removeTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
