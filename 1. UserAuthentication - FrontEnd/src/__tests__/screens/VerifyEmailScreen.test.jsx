import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import VerifyEmailScreen from '../../screens/auth/VerifyEmailScreen';
import { AuthContext } from '../../context/AuthContext';

jest.mock('../../api/auth.api', () => ({
  verifyEmail:        jest.fn().mockResolvedValue({ data: { success: true } }),
  resendVerification: jest.fn().mockResolvedValue({ data: { success: true } }),
  getMe:              jest.fn().mockResolvedValue({ data: { data: { id: '1', email: 'user@test.com' } } }),
}));

const mockSetUser    = jest.fn();
const mockNavigation = { navigate: jest.fn() };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{ setUser: mockSetUser, user: null, loading: false }}>
    {children}
  </AuthContext.Provider>
);

const renderScreen = (email = 'user@test.com') =>
  render(
    <VerifyEmailScreen
      navigation={mockNavigation}
      route={{ params: { email } }}
    />,
    { wrapper }
  );

describe('VerifyEmailScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Rendering ──────────────────────────────────────────────────────────────
  it('renders Verify Email button', () => {
    const { getByText } = renderScreen();
    expect(getByText('Verify Email')).toBeTruthy();
  });

  it('renders the OTP input field', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('Enter 6-digit code')).toBeTruthy();
  });

  it('displays the email address passed via route params', () => {
    const { getByText } = renderScreen('hello@example.com');
    expect(getByText('hello@example.com')).toBeTruthy();
  });

  it('renders the Verify Your Email title', () => {
    const { getByText } = renderScreen();
    expect(getByText('Verify Your Email')).toBeTruthy();
  });

  it('renders Back to Sign In link', () => {
    const { getByText } = renderScreen();
    expect(getByText(/Back to Sign In/i)).toBeTruthy();
  });

  it('renders resend countdown text initially', () => {
    const { getByText } = renderScreen();
    expect(getByText(/Resend code in/i)).toBeTruthy();
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  it('shows alert and does not call API when OTP is empty', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Verify Email'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Enter the 6-digit code');
    });
    const { verifyEmail } = require('../../api/auth.api');
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it('shows alert when OTP is fewer than 6 digits', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Enter 6-digit code'), '123');
    fireEvent.press(getByText('Verify Email'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Enter the 6-digit code');
    });
  });

  // ── Successful verification ────────────────────────────────────────────────
  it('calls verifyEmail API with correct email and OTP', async () => {
    const { verifyEmail } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = renderScreen('user@test.com');
    fireEvent.changeText(getByPlaceholderText('Enter 6-digit code'), '123456');
    fireEvent.press(getByText('Verify Email'));
    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith({ email: 'user@test.com', otp: '123456' });
    });
  });

  it('calls getMe and setUser after successful verification', async () => {
    const { getMe } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Enter 6-digit code'), '123456');
    fireEvent.press(getByText('Verify Email'));
    await waitFor(() => {
      expect(getMe).toHaveBeenCalled();
      expect(mockSetUser).toHaveBeenCalledWith({ id: '1', email: 'user@test.com' });
    });
  });

  // ── API failure ────────────────────────────────────────────────────────────
  it('shows Failed alert when verifyEmail API rejects', async () => {
    const { verifyEmail } = require('../../api/auth.api');
    verifyEmail.mockRejectedValueOnce({
      response: { data: { message: 'Invalid code' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Enter 6-digit code'), '000000');
    fireEvent.press(getByText('Verify Email'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed', 'Invalid code');
    });
  });

  it('shows fallback error message when API error has no message', async () => {
    const { verifyEmail } = require('../../api/auth.api');
    verifyEmail.mockRejectedValueOnce(new Error('Network error'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Enter 6-digit code'), '000000');
    fireEvent.press(getByText('Verify Email'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed', 'Invalid code');
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  it('navigates to Login when Back to Sign In is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText(/Back to Sign In/i));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});
