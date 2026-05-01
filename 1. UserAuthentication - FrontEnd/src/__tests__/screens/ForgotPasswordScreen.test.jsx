import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';

jest.mock('../../api/auth.api', () => ({
  forgotPassword: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

const mockNavigation = { navigate: jest.fn() };

describe('ForgotPasswordScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Send Reset Code button', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={mockNavigation} />);
    expect(getByText('Send Reset Code')).toBeTruthy();
  });

  it('renders email input', () => {
    const { getByPlaceholderText } = render(<ForgotPasswordScreen navigation={mockNavigation} />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'notanemail');
    fireEvent.press(getByText('Send Reset Code'));
    await waitFor(() => {
      const { forgotPassword } = require('../../api/auth.api');
      expect(forgotPassword).not.toHaveBeenCalled();
    });
  });

  it('calls forgotPassword API with valid email', async () => {
    const { forgotPassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.press(getByText('Send Reset Code'));
    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith({ email: 'user@test.com' });
    });
  });

  it('navigates back to Login', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={mockNavigation} />);
    fireEvent.press(getByText(/Back to Sign In/i));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });
});
