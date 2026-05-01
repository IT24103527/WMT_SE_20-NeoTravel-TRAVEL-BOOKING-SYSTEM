import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ResetPasswordScreen from '../../screens/auth/ResetPasswordScreen';

jest.mock('../../api/auth.api', () => ({
  resetPassword: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

const mockNavigation = { navigate: jest.fn(), replace: jest.fn() };

const renderScreen = (email = 'user@test.com') =>
  render(
    <ResetPasswordScreen
      navigation={mockNavigation}
      route={{ params: { email } }}
    />
  );

// "Reset Password" appears as both the page title and the button label.
// Helper to press the button (last occurrence).
const pressResetBtn = (getAllByText) => {
  const els = getAllByText('Reset Password');
  fireEvent.press(els[els.length - 1]);
};

describe('ResetPasswordScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Rendering ──────────────────────────────────────────────────────────────
  it('renders Reset Password title and button', () => {
    const { getAllByText } = renderScreen();
    expect(getAllByText('Reset Password').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all three input fields', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('6-digit code')).toBeTruthy();
    expect(getByPlaceholderText('Create a strong password')).toBeTruthy();
    expect(getByPlaceholderText('Repeat your password')).toBeTruthy();
  });

  it('displays the email from route params in subtitle', () => {
    const { getByText } = renderScreen('hello@example.com');
    expect(getByText(/hello@example.com/i)).toBeTruthy();
  });

  it('renders Back navigation link', () => {
    const { getByText } = renderScreen();
    expect(getByText(/← Back/i)).toBeTruthy();
  });

  // ── Validation — OTP ───────────────────────────────────────────────────────
  it('does not call API when OTP is empty', async () => {
    const { resetPassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getAllByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'NewPass@1234');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(resetPassword).not.toHaveBeenCalled();
    });
  });

  it('shows OTP error when code is fewer than 6 digits', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '123');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'NewPass@1234');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(getByText('Enter the 6-digit code')).toBeTruthy();
    });
  });

  // ── Validation — passwords ─────────────────────────────────────────────────
  it('does not call API when passwords do not match', async () => {
    const { resetPassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getAllByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '123456');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'DifferentPass@1');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(resetPassword).not.toHaveBeenCalled();
    });
  });

  it('shows confirm error when passwords do not match', async () => {
    const { getByPlaceholderText, getAllByText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '123456');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'DifferentPass@1');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('does not call API when password is too weak', async () => {
    const { resetPassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getAllByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '123456');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'weak');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'weak');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(resetPassword).not.toHaveBeenCalled();
    });
  });

  // ── Successful reset ───────────────────────────────────────────────────────
  it('calls resetPassword API with correct payload', async () => {
    const { resetPassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getAllByText } = renderScreen('user@test.com');
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '123456');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'NewPass@1234');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        email:       'user@test.com',
        otp:         '123456',
        newPassword: 'NewPass@1234',
      });
    });
  });

  it('shows success alert after successful reset', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getAllByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '123456');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'NewPass@1234');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        'Your password has been reset.',
        expect.any(Array)
      );
    });
  });

  // ── API failure ────────────────────────────────────────────────────────────
  it('shows Failed alert when API rejects with a message', async () => {
    const { resetPassword } = require('../../api/auth.api');
    resetPassword.mockRejectedValueOnce({
      response: { data: { message: 'Invalid or expired code' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getAllByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '000000');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'NewPass@1234');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed', 'Invalid or expired code');
    });
  });

  it('shows fallback error message when API error has no message', async () => {
    const { resetPassword } = require('../../api/auth.api');
    resetPassword.mockRejectedValueOnce(new Error('Network error'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getAllByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('6-digit code'), '000000');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'NewPass@1234');
    pressResetBtn(getAllByText);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed', 'Invalid or expired code');
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  it('navigates to ForgotPassword when Back is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText(/← Back/i));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
