/**
 * Integration tests — Profile Screen Navigation Flow (Frontend)
 *
 * Tests complete multi-screen user journeys through the profile navigator
 * screens: ChangePassword, LoginHistory, ActivityLog, Sessions, Privacy,
 * ExportData, VerifyEmailSettings.
 *
 * Each test renders the target screen inside a real NavigationContainer so
 * navigation.goBack() and navigation.navigate() actually work.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../../context/AuthContext';
import ChangePasswordScreen      from '../../screens/profile/ChangePasswordScreen';
import LoginHistoryScreen        from '../../screens/profile/LoginHistoryScreen';
import ActivityLogScreen         from '../../screens/profile/ActivityLogScreen';
import SessionsScreen            from '../../screens/profile/SessionsScreen';
import PrivacyScreen             from '../../screens/profile/PrivacyScreen';
import ExportDataScreen          from '../../screens/profile/ExportDataScreen';
import VerifyEmailSettingsScreen from '../../screens/profile/VerifyEmailSettingsScreen';

// ─── Mock all API calls ───────────────────────────────────────────────────────
jest.mock('../../api/auth.api', () => ({
  changePassword:     jest.fn().mockResolvedValue({ data: { success: true } }),
  getLoginHistory:    jest.fn().mockResolvedValue({ data: { data: [
    { ip: '127.0.0.1', device: 'Chrome',  timestamp: new Date().toISOString(), success: true  },
    { ip: '10.0.0.1',  device: 'Mobile',  timestamp: new Date().toISOString(), success: false },
  ]}}),
  getActivityLog:     jest.fn().mockResolvedValue({ data: { data: [
    { action: 'profile_updated',  detail: 'Info updated', ip: '127.0.0.1', timestamp: new Date().toISOString() },
    { action: 'password_changed', detail: 'Password changed', ip: '127.0.0.1', timestamp: new Date().toISOString() },
  ]}}),
  clearActivityLog:   jest.fn().mockResolvedValue({ data: { success: true } }),
  getSessions:        jest.fn().mockResolvedValue({ data: { data: [
    { sessionId: 'sess-1', device: 'Chrome Desktop', ip: '127.0.0.1', lastActive: new Date().toISOString() },
    { sessionId: 'sess-2', device: 'iPhone Safari',  ip: '10.0.0.1',  lastActive: new Date().toISOString() },
  ]}}),
  revokeSession:      jest.fn().mockResolvedValue({ data: { success: true } }),
  revokeAllSessions:  jest.fn().mockResolvedValue({ data: { success: true } }),
  exportAccount:      jest.fn().mockResolvedValue({ data: { data: {
    exportedAt: new Date().toISOString(),
    profile: {
      username: 'testuser', email: 'test@test.com',
      phone: '+1234567890', bio: 'Hello', isVerified: true,
      memberSince: new Date().toISOString(),
    },
    preferences: {}, privacy: {}, loginHistory: [{ success: true }], activityLog: [{ action: 'login' }],
  }}}),
  getMe:              jest.fn().mockResolvedValue({ data: { data: {
    privacy: { profileVisible: true, showEmail: false, showPhone: false, showLastSeen: true },
  }}}),
  updatePrivacy:      jest.fn().mockResolvedValue({ data: { success: true } }),
  verifyEmail:        jest.fn().mockResolvedValue({ data: { success: true } }),
  resendVerification: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

// ─── Shared auth context ──────────────────────────────────────────────────────
const authContextValue = {
  user: { username: 'testuser', email: 'test@test.com', isVerified: true },
  loading: false, isGuest: false,
  login: jest.fn(), signup: jest.fn(), logout: jest.fn(),
  continueAsGuest: jest.fn(), setUser: jest.fn(),
};

// ─── Stack navigator helper ───────────────────────────────────────────────────
const Stack = createNativeStackNavigator();

// Minimal "Home" placeholder so goBack() has somewhere to go
const HomeScreen = () => null;

const renderStack = (ScreenComponent, params = {}) =>
  render(
    <AuthContext.Provider value={authContextValue}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Target"
          screenOptions={{ headerShown: false, animation: 'none' }}
        >
          <Stack.Screen name="Home"   component={HomeScreen} />
          <Stack.Screen name="Target" component={ScreenComponent}
            initialParams={params}
          />
          {/* Register sibling screens so navigate() calls work */}
          <Stack.Screen name="ChangePassword"      component={ChangePasswordScreen} />
          <Stack.Screen name="LoginHistory"        component={LoginHistoryScreen} />
          <Stack.Screen name="ActivityLog"         component={ActivityLogScreen} />
          <Stack.Screen name="Sessions"            component={SessionsScreen} />
          <Stack.Screen name="Privacy"             component={PrivacyScreen} />
          <Stack.Screen name="ExportData"          component={ExportDataScreen} />
          <Stack.Screen name="VerifyEmailSettings" component={VerifyEmailSettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 1: ChangePassword
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: ChangePassword screen', () => {
  it('renders all three password input fields', () => {
    const { getByPlaceholderText } = renderStack(ChangePasswordScreen);
    expect(getByPlaceholderText('Your current password')).toBeTruthy();
    expect(getByPlaceholderText('Create a strong password')).toBeTruthy();
    expect(getByPlaceholderText('Repeat new password')).toBeTruthy();
  });

  it('calls changePassword API with correct payload on valid submit', async () => {
    const { changePassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = renderStack(ChangePasswordScreen);

    fireEvent.changeText(getByPlaceholderText('Your current password'), 'OldPass@1');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat new password'), 'NewPass@1234');
    fireEvent.press(getByText('Update Password'));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass@1',
        newPassword:     'NewPass@1234',
      });
    });
  });

  it('does not call API when passwords do not match', async () => {
    const { changePassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = renderStack(ChangePasswordScreen);

    fireEvent.changeText(getByPlaceholderText('Your current password'), 'OldPass@1');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat new password'), 'DifferentPass@1');
    fireEvent.press(getByText('Update Password'));

    await waitFor(() => {
      expect(changePassword).not.toHaveBeenCalled();
    });
  });

  it('shows mismatch error message', async () => {
    const { getByPlaceholderText, getByText } = renderStack(ChangePasswordScreen);

    fireEvent.changeText(getByPlaceholderText('Your current password'), 'OldPass@1');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat new password'), 'DifferentPass@1');
    fireEvent.press(getByText('Update Password'));

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('shows password rules checklist', () => {
    const { getByText } = renderStack(ChangePasswordScreen);
    expect(getByText(/At least 8 characters/i)).toBeTruthy();
    expect(getByText(/One uppercase letter/i)).toBeTruthy();
    expect(getByText(/One number/i)).toBeTruthy();
    expect(getByText(/One special character/i)).toBeTruthy();
  });

  it('shows API error message when changePassword rejects', async () => {
    const { changePassword } = require('../../api/auth.api');
    changePassword.mockRejectedValueOnce({
      response: { data: { message: 'Current password is incorrect' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByPlaceholderText, getByText } = renderStack(ChangePasswordScreen);

    fireEvent.changeText(getByPlaceholderText('Your current password'), 'WrongPass@1');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat new password'), 'NewPass@1234');
    fireEvent.press(getByText('Update Password'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Current password is incorrect');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 2: LoginHistory screen
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: LoginHistory screen', () => {
  it('renders login history entries from API', async () => {
    const { getByText } = renderStack(LoginHistoryScreen);
    await waitFor(() => {
      expect(getByText('Chrome')).toBeTruthy();
      expect(getByText('Mobile')).toBeTruthy();
    });
  });

  it('shows Success and Failed status labels', async () => {
    const { getByText } = renderStack(LoginHistoryScreen);
    await waitFor(() => {
      expect(getByText('Success')).toBeTruthy();
      expect(getByText('Failed')).toBeTruthy();
    });
  });

  it('shows IP addresses for each entry', async () => {
    const { getByText } = renderStack(LoginHistoryScreen);
    await waitFor(() => {
      expect(getByText('127.0.0.1')).toBeTruthy();
      expect(getByText('10.0.0.1')).toBeTruthy();
    });
  });

  it('shows Clear History button when history is non-empty', async () => {
    const { getByText } = renderStack(LoginHistoryScreen);
    await waitFor(() => {
      expect(getByText('Clear History')).toBeTruthy();
    });
  });

  it('calls getLoginHistory API on mount', async () => {
    const { getLoginHistory } = require('../../api/auth.api');
    renderStack(LoginHistoryScreen);
    await waitFor(() => {
      expect(getLoginHistory).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 3: ActivityLog screen
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: ActivityLog screen', () => {
  it('renders activity log entries from API', async () => {
    const { getByText } = renderStack(ActivityLogScreen);
    await waitFor(() => {
      expect(getByText('Profile Updated')).toBeTruthy();
      expect(getByText('Password Changed')).toBeTruthy();
    });
  });

  it('shows Clear Log button when log is non-empty', async () => {
    const { getByText } = renderStack(ActivityLogScreen);
    await waitFor(() => {
      expect(getByText('Clear Log')).toBeTruthy();
    });
  });

  it('calls getActivityLog API on mount', async () => {
    const { getActivityLog } = require('../../api/auth.api');
    renderStack(ActivityLogScreen);
    await waitFor(() => {
      expect(getActivityLog).toHaveBeenCalled();
    });
  });

  it('shows empty state when log is empty', async () => {
    const { getActivityLog } = require('../../api/auth.api');
    getActivityLog.mockResolvedValueOnce({ data: { data: [] } });

    const { getByText } = renderStack(ActivityLogScreen);
    await waitFor(() => {
      expect(getByText('No activity recorded yet')).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 4: Sessions screen
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: Sessions screen', () => {
  it('renders session entries from API', async () => {
    const { getByText } = renderStack(SessionsScreen);
    await waitFor(() => {
      expect(getByText('Chrome Desktop')).toBeTruthy();
      expect(getByText('iPhone Safari')).toBeTruthy();
    });
  });

  it('shows Sign Out All Devices button when multiple sessions exist', async () => {
    const { getByText } = renderStack(SessionsScreen);
    await waitFor(() => {
      expect(getByText('Sign Out All Devices')).toBeTruthy();
    });
  });

  it('shows Revoke button for each session', async () => {
    const { getAllByText } = renderStack(SessionsScreen);
    await waitFor(() => {
      expect(getAllByText('Revoke').length).toBe(2);
    });
  });

  it('calls revokeSession API when Revoke is pressed', async () => {
    const { revokeSession } = require('../../api/auth.api');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementationOnce(
      (_title, _msg, buttons) => buttons.find((b) => b.style === 'destructive')?.onPress()
    );

    const { getAllByText } = renderStack(SessionsScreen);
    await waitFor(() => {
      expect(getAllByText('Revoke').length).toBeGreaterThan(0);
    });

    fireEvent.press(getAllByText('Revoke')[0]);

    await waitFor(() => {
      expect(revokeSession).toHaveBeenCalledWith('sess-1');
    });
  });

  it('shows empty state when no sessions exist', async () => {
    const { getSessions } = require('../../api/auth.api');
    getSessions.mockResolvedValueOnce({ data: { data: [] } });

    const { getByText } = renderStack(SessionsScreen);
    await waitFor(() => {
      expect(getByText('No active sessions')).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 5: Privacy screen
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: Privacy screen', () => {
  it('renders all four privacy toggle labels', async () => {
    const { getByText } = renderStack(PrivacyScreen);
    await waitFor(() => {
      expect(getByText('Public Profile')).toBeTruthy();
      expect(getByText('Show Email')).toBeTruthy();
      expect(getByText('Show Phone')).toBeTruthy();
      expect(getByText('Show Last Seen')).toBeTruthy();
    });
  });

  it('renders Save Privacy Settings button', async () => {
    const { getByText } = renderStack(PrivacyScreen);
    await waitFor(() => {
      expect(getByText('Save Privacy Settings')).toBeTruthy();
    });
  });

  it('pressing Save calls updatePrivacy API', async () => {
    const { updatePrivacy } = require('../../api/auth.api');
    const { getByText } = renderStack(PrivacyScreen);

    await waitFor(() => {
      expect(getByText('Save Privacy Settings')).toBeTruthy();
    });

    fireEvent.press(getByText('Save Privacy Settings'));

    await waitFor(() => {
      expect(updatePrivacy).toHaveBeenCalled();
    });
  });

  it('calls getMe API on mount to load current settings', async () => {
    const { getMe } = require('../../api/auth.api');
    renderStack(PrivacyScreen);
    await waitFor(() => {
      expect(getMe).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 6: ExportData screen
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: ExportData screen', () => {
  it('renders Export My Data button', () => {
    const { getByText } = renderStack(ExportDataScreen);
    expect(getByText('Export My Data')).toBeTruthy();
  });

  it('renders info card describing what is exported', () => {
    const { getByText } = renderStack(ExportDataScreen);
    expect(getByText('Your Data')).toBeTruthy();
  });

  it('pressing Export calls exportAccount API', async () => {
    const { exportAccount } = require('../../api/auth.api');
    const { getByText } = renderStack(ExportDataScreen);

    fireEvent.press(getByText('Export My Data'));

    await waitFor(() => {
      expect(exportAccount).toHaveBeenCalled();
    });
  });

  it('shows Export Ready section after successful export', async () => {
    const { getByText } = renderStack(ExportDataScreen);

    fireEvent.press(getByText('Export My Data'));

    await waitFor(() => {
      expect(getByText('Export Ready')).toBeTruthy();
    });
  });

  it('shows correct email in exported data', async () => {
    const { getByText } = renderStack(ExportDataScreen);

    fireEvent.press(getByText('Export My Data'));

    await waitFor(() => {
      expect(getByText('test@test.com')).toBeTruthy();
    });
  });

  it('shows login history count in exported data', async () => {
    const { getByText } = renderStack(ExportDataScreen);

    fireEvent.press(getByText('Export My Data'));

    await waitFor(() => {
      expect(getByText('1 records')).toBeTruthy();
    });
  });

  it('shows error alert when exportAccount API fails', async () => {
    const { exportAccount } = require('../../api/auth.api');
    exportAccount.mockRejectedValueOnce({
      response: { data: { message: 'Export failed' } },
    });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderStack(ExportDataScreen);

    fireEvent.press(getByText('Export My Data'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Export failed');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 7: VerifyEmailSettings screen
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: VerifyEmailSettings screen', () => {
  it('renders Verify Your Email title', async () => {
    const { getByText } = renderStack(VerifyEmailSettingsScreen, { email: 'test@test.com' });
    await waitFor(() => {
      expect(getByText('Verify Your Email')).toBeTruthy();
    });
  });

  it('renders the email from route params', async () => {
    const { getByText } = renderStack(VerifyEmailSettingsScreen, { email: 'test@test.com' });
    await waitFor(() => {
      expect(getByText('test@test.com')).toBeTruthy();
    });
  });

  it('renders Verify Email button', async () => {
    const { getByText } = renderStack(VerifyEmailSettingsScreen, { email: 'test@test.com' });
    await waitFor(() => {
      expect(getByText('Verify Email')).toBeTruthy();
    });
  });

  it('calls verifyEmail API with correct payload', async () => {
    const { verifyEmail } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = renderStack(
      VerifyEmailSettingsScreen, { email: 'test@test.com' }
    );

    await waitFor(() => {
      expect(getByPlaceholderText('Enter 6-digit code')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Enter 6-digit code'), '123456');
    fireEvent.press(getByText('Verify Email'));

    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith({ email: 'test@test.com', otp: '123456' });
    });
  });

  it('shows alert when OTP is empty', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderStack(VerifyEmailSettingsScreen, { email: 'test@test.com' });

    await waitFor(() => {
      expect(getByText('Verify Email')).toBeTruthy();
    });

    fireEvent.press(getByText('Verify Email'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Enter the 6-digit code');
    });
  });

  it('auto-sends OTP on mount by calling resendVerification', async () => {
    const { resendVerification } = require('../../api/auth.api');
    renderStack(VerifyEmailSettingsScreen, { email: 'test@test.com' });
    await waitFor(() => {
      expect(resendVerification).toHaveBeenCalledWith({ email: 'test@test.com' });
    });
  });
});
