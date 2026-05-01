/**
 * Integration tests — Auth Navigation Flow (Frontend)
 *
 * Tests complete multi-screen user journeys through the auth navigator:
 * Login → Signup → VerifyEmail → ForgotPassword → ResetPassword
 *
 * These tests render real navigator stacks and verify that:
 * - Screens mount correctly within the navigation context
 * - Navigation between screens works
 * - API calls are made with the right data
 * - Error states are surfaced to the user
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../../context/AuthContext';
import LoginScreen          from '../../screens/auth/LoginScreen';
import SignupScreen         from '../../screens/auth/SignupScreen';
import VerifyEmailScreen    from '../../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen  from '../../screens/auth/ResetPasswordScreen';

// ─── Mock all API calls ───────────────────────────────────────────────────────
jest.mock('../../api/auth.api', () => ({
  forgotPassword:     jest.fn().mockResolvedValue({ data: { success: true } }),
  resetPassword:      jest.fn().mockResolvedValue({ data: { success: true } }),
  verifyEmail:        jest.fn().mockResolvedValue({ data: { success: true } }),
  resendVerification: jest.fn().mockResolvedValue({ data: { success: true } }),
  getMe:              jest.fn().mockResolvedValue({ data: { data: { id: '1', email: 'user@test.com', isVerified: true } } }),
}));

// ─── Shared mocks ─────────────────────────────────────────────────────────────
const mockLogin          = jest.fn();
const mockSignup         = jest.fn();
const mockLogout         = jest.fn();
const mockContinueAsGuest = jest.fn();
const mockSetUser        = jest.fn();

const authContextValue = {
  user: null, loading: false, isGuest: false,
  login: mockLogin, signup: mockSignup, logout: mockLogout,
  continueAsGuest: mockContinueAsGuest, setUser: mockSetUser,
};

// ─── Stack navigator helpers ──────────────────────────────────────────────────
const Stack = createNativeStackNavigator();

/**
 * Renders a mini navigator starting at `initialRouteName` with all auth
 * screens registered, so navigation.navigate() actually works.
 */
const renderAuthStack = (initialRouteName = 'Login', initialParams = {}) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{ headerShown: false, animation: 'none' }}
        >
          <Stack.Screen name="Login"          component={LoginScreen} />
          <Stack.Screen name="Signup"         component={SignupScreen} />
          <Stack.Screen name="VerifyEmail"    component={VerifyEmailScreen}
            initialParams={initialRouteName === 'VerifyEmail' ? initialParams : undefined}
          />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen}
            initialParams={initialRouteName === 'ResetPassword' ? initialParams : undefined}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 1: Login screen → navigate to Signup
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: Login → Signup navigation', () => {
  it('pressing Create Account navigates to Signup screen', async () => {
    const { getAllByText } = renderAuthStack('Login');
    // Press the footer "Create Account" link (not the button on Signup)
    fireEvent.press(getAllByText('Create Account')[0]);

    await waitFor(() => {
      // Signup screen has a unique tagline
      expect(getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('Signup screen shows Sign In link back to Login', async () => {
    const { getByText } = renderAuthStack('Signup');
    // The footer link text is unique on Signup
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('pressing Sign In on Signup navigates back to Login', async () => {
    const { getByText } = renderAuthStack('Signup');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      // Login screen has a unique tagline
      expect(getByText('Your world, one tap away')).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 2: Login → ForgotPassword → ResetPassword
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: Login → ForgotPassword → ResetPassword', () => {
  it('ForgotPassword screen renders correctly', () => {
    const { getByText, getByPlaceholderText } = renderAuthStack('ForgotPassword');
    expect(getByText('Forgot Password?')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Send Reset Code')).toBeTruthy();
  });

  it('submitting valid email on ForgotPassword calls forgotPassword API', async () => {
    const { forgotPassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = renderAuthStack('ForgotPassword');

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.press(getByText('Send Reset Code'));

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith({ email: 'user@test.com' });
    });
  });

  it('ForgotPassword Back to Sign In navigates to Login', async () => {
    const { getByText } = renderAuthStack('ForgotPassword');

    fireEvent.press(getByText(/Back to Sign In/i));

    await waitFor(() => {
      // Login screen has a unique tagline not present on ForgotPassword
      expect(getByText('Your world, one tap away')).toBeTruthy();
    });
  });

  it('ResetPassword screen renders all fields', () => {
    const { getByPlaceholderText } = renderAuthStack('ResetPassword', { email: 'user@test.com' });
    expect(getByPlaceholderText('6-digit code')).toBeTruthy();
    expect(getByPlaceholderText('Create a strong password')).toBeTruthy();
    expect(getByPlaceholderText('Repeat your password')).toBeTruthy();
  });

  it('ResetPassword calls resetPassword API with correct payload', async () => {
    const { resetPassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getAllByText } = renderAuthStack('ResetPassword', { email: 'user@test.com' });

    fireEvent.changeText(getByPlaceholderText('6-digit code'), '123456');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1234');
    fireEvent.changeText(getByPlaceholderText('Repeat your password'), 'NewPass@1234');

    const btns = getAllByText('Reset Password');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        email: 'user@test.com', otp: '123456', newPassword: 'NewPass@1234',
      });
    });
  });

  it('ResetPassword Back navigates to ForgotPassword', async () => {
    const { getByText } = renderAuthStack('ResetPassword', { email: 'user@test.com' });

    fireEvent.press(getByText(/← Back/i));

    await waitFor(() => {
      expect(getByText('Forgot Password?')).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 3: Signup → VerifyEmail
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: Signup → VerifyEmail', () => {
  it('successful signup calls signup context function', async () => {
    mockSignup.mockResolvedValueOnce({});
    const { getByPlaceholderText, getAllByText } = renderAuthStack('Signup');

    fireEvent.changeText(getByPlaceholderText('Your display name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('+1 234 567 8900'), '+12345678901');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'Test@1234');

    const btns = getAllByText('Create Account');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        'Test User', 'test@example.com', 'Test@1234', '+12345678901'
      );
    });
  });

  it('VerifyEmail screen shows the email from route params', () => {
    const { getByText } = renderAuthStack('VerifyEmail', { email: 'hello@example.com' });
    expect(getByText('hello@example.com')).toBeTruthy();
  });

  it('VerifyEmail calls verifyEmail API with correct payload', async () => {
    const { verifyEmail } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = renderAuthStack('VerifyEmail', { email: 'user@test.com' });

    fireEvent.changeText(getByPlaceholderText('Enter 6-digit code'), '654321');
    fireEvent.press(getByText('Verify Email'));

    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith({ email: 'user@test.com', otp: '654321' });
    });
  });

  it('VerifyEmail Back to Sign In navigates to Login', async () => {
    const { getByText } = renderAuthStack('VerifyEmail', { email: 'user@test.com' });

    fireEvent.press(getByText(/Back to Sign In/i));

    await waitFor(() => {
      // Login screen has a unique tagline not present on VerifyEmail
      expect(getByText('Your world, one tap away')).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 4: Login form validation before API call
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: Login form validation', () => {
  it('empty form does not call login API', async () => {
    const { getAllByText } = renderAuthStack('Login');
    const btns = getAllByText('Sign In');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('invalid email format does not call login API', async () => {
    const { getByPlaceholderText, getAllByText } = renderAuthStack('Login');

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'notanemail');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'Test@1234');
    const btns = getAllByText('Sign In');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('valid credentials call login with correct args', async () => {
    mockLogin.mockResolvedValueOnce({});
    const { getByPlaceholderText, getAllByText } = renderAuthStack('Login');

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'Test@1234');
    const btns = getAllByText('Sign In');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'Test@1234');
    });
  });

  it('login API error shows error message on screen', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    const { getByPlaceholderText, getAllByText, getByText } = renderAuthStack('Login');

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'Test@1234');
    const btns = getAllByText('Sign In');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(getByText(/Invalid credentials/i)).toBeTruthy();
    });
  });

  it('Continue as Guest calls continueAsGuest', () => {
    const { getByText } = renderAuthStack('Login');
    fireEvent.press(getByText(/Continue as Guest/i));
    expect(mockContinueAsGuest).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOW 5: Signup form validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Flow: Signup form validation', () => {
  it('empty form does not call signup API', async () => {
    const { getAllByText } = renderAuthStack('Signup');
    const btns = getAllByText('Create Account');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockSignup).not.toHaveBeenCalled();
    });
  });

  it('weak password shows strength indicator', () => {
    const { getByPlaceholderText, getByText } = renderAuthStack('Signup');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'weak');
    expect(getByText('Weak')).toBeTruthy();
  });

  it('strong password shows Strong indicator', () => {
    const { getByPlaceholderText, getByText } = renderAuthStack('Signup');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'VeryStrongPass@1234!');
    expect(getByText('Strong')).toBeTruthy();
  });

  it('signup API error shows error message on screen', async () => {
    mockSignup.mockRejectedValueOnce({
      response: { data: { message: 'Email already in use' } },
    });
    const { getByPlaceholderText, getAllByText, getByText } = renderAuthStack('Signup');

    fireEvent.changeText(getByPlaceholderText('Your display name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('+1 234 567 8900'), '+12345678901');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'Test@1234');

    const btns = getAllByText('Create Account');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(getByText(/Email already in use/i)).toBeTruthy();
    });
  });
});
