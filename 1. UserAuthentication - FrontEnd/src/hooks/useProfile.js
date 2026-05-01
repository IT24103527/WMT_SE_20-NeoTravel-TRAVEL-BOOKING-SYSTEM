import { useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth.api';

/**
 * Fetches the full user profile from the backend.
 * Returns { profile, loading, error, refetch }
 */
const useProfile = () => {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getMe();
      setProfile(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { profile, loading, error, refetch };
};

export default useProfile;
