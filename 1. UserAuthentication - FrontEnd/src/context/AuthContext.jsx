import { createContext, useState, useEffect } from 'react';
import { saveTokens, getToken, getRefreshToken, removeTokens } from '../utils/storage';
import {
  login as loginApi, signup as signupApi,
  getMe, logoutApi, refreshTokenApi,
} from '../api/auth.api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Restore session on launch
  useEffect(() => {
    let isMounted = true;
    const loadingTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000);

    const restore = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        try {
          const { data } = await getMe();
          if (isMounted) setUser(data.user);
        } catch (err) {
          // Access token expired — try refresh
          if (err.response?.data?.code === 'TOKEN_EXPIRED') {
            const refresh = await getRefreshToken();
            if (refresh) {
              const { data } = await refreshTokenApi({ refreshToken: refresh });
              await saveTokens(data.data.accessToken, data.data.refreshToken);
              const me = await getMe();
              if (isMounted) setUser(me.data.data);
            }
          } else {
            await removeTokens();
          }
        }
      } catch {
        await removeTokens();
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    restore();

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await loginApi({ email, password });
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    setIsGuest(false);
    setUser(data.data.user);
    return data;
  };

  const signup = async (username, email, password, phone) => {
    const { data } = await signupApi({ username, email, password, phone });
    // Save tokens but do NOT set user yet — user must verify email first
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    setIsGuest(false);
    // Return data so SignupScreen can navigate to VerifyEmail
    return data;
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser({ username: 'Guest', email: '', isGuest: true, isVerified: false });
  };

  const logout = async () => {
    try { await logoutApi(); } catch {}
    await removeTokens();
    setUser(null);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading, isGuest, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};
