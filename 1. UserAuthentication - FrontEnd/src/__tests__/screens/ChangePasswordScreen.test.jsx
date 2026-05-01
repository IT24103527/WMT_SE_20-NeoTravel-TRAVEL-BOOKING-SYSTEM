import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChangePasswordScreen from '../../screens/profile/ChangePasswordScreen';

jest.mock('../../api/auth.api', () => ({
  changePassword: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

const mockNavigation = { goBack: jest.fn() };

describe('ChangePasswordScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Update Password button', () => {
    const { getByText } = render(<ChangePasswordScreen navigation={mockNavigation} />);
    expect(getByText('Update Password')).toBeTruthy();
  });

  it('renders all three password fields', () => {
    const { getByPlaceholderText } = render(<ChangePasswordScreen navigation={mockNavigation} />);
    expect(getByPlaceholderText('Your current password')).toBeTruthy();
    expect(getByPlaceholderText('Create a strong password')).toBeTruthy();
    expect(getByPlaceholderText('Repeat new password')).toBeTruthy();
  });

  it('does not call API when fields are empty', async () => {
    const { changePassword } = require('../../api/auth.api');
    const { getByText } = render(<ChangePasswordScreen navigation={mockNavigation} />);
    fireEvent.press(getByText('Update Password'));
    await waitFor(() => {
      expect(changePassword).not.toHaveBeenCalled();
    });
  });

  it('shows error when passwords do not match', async () => {
    const { changePassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = render(
      <ChangePasswordScreen navigation={mockNavigation} />
    );
    fireEvent.changeText(getByPlaceholderText('Your current password'), 'OldPass@1');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'NewPass@1');
    fireEvent.changeText(getByPlaceholderText('Repeat new password'), 'DifferentPass@1');
    fireEvent.press(getByText('Update Password'));
    await waitFor(() => {
      expect(changePassword).not.toHaveBeenCalled();
    });
  });

  it('calls changePassword API with matching passwords', async () => {
    const { changePassword } = require('../../api/auth.api');
    const { getByPlaceholderText, getByText } = render(
      <ChangePasswordScreen navigation={mockNavigation} />
    );
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

  it('shows password rules checklist', () => {
    const { getByText } = render(<ChangePasswordScreen navigation={mockNavigation} />);
    expect(getByText(/At least 8 characters/i)).toBeTruthy();
    expect(getByText(/One uppercase letter/i)).toBeTruthy();
    expect(getByText(/One number/i)).toBeTruthy();
  });
});
