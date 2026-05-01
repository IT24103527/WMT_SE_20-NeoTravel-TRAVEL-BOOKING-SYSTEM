import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { AuthContext } from '../../context/AuthContext';
import useAuth from '../../hooks/useAuth';

const mockContextValue = {
  user:             { username: 'testuser', email: 'test@x.com' },
  loading:          false,
  isGuest:          false,
  login:            jest.fn(),
  signup:           jest.fn(),
  logout:           jest.fn(),
  continueAsGuest:  jest.fn(),
  setUser:          jest.fn(),
};

const wrapper = ({ children }) => (
  <AuthContext.Provider value={mockContextValue}>
    {children}
  </AuthContext.Provider>
);

describe('useAuth hook', () => {
  it('returns user from context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user.username).toBe('testuser');
  });

  it('returns loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(false);
  });

  it('exposes login function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.login).toBe('function');
  });

  it('exposes logout function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.logout).toBe('function');
  });

  it('exposes signup function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.signup).toBe('function');
  });

  it('exposes continueAsGuest function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(typeof result.current.continueAsGuest).toBe('function');
  });

  it('returns isGuest flag', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isGuest).toBe(false);
  });
});
