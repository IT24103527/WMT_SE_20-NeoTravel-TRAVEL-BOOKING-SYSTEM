import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignupScreen from '../../screens/auth/SignupScreen';
import { AuthContext } from '../../context/AuthContext';

const mockSignup = jest.fn();
const mockNavigation = { navigate: jest.fn() };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{
    signup: mockSignup,
    user: null, loading: false, isGuest: false,
  }}>
    {children}
  </AuthContext.Provider>
);

const renderScreen = () =>
  render(<SignupScreen navigation={mockNavigation} />, { wrapper });

describe('SignupScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Create Account button', () => {
    const { getAllByText } = renderScreen();
    expect(getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all input fields', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('Your display name')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('+1 234 567 8900')).toBeTruthy();
    expect(getByPlaceholderText('Create a strong password')).toBeTruthy();
  });

  it('does not call signup when fields are empty', async () => {
    const { getAllByText } = renderScreen();
    const btns = getAllByText('Create Account');
    fireEvent.press(btns[btns.length - 1]);
    await waitFor(() => {
      expect(mockSignup).not.toHaveBeenCalled();
    });
  });

  it('calls signup with all fields on valid submit', async () => {
    mockSignup.mockResolvedValueOnce({});
    const { getByPlaceholderText, getAllByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Your display name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('+1 234 567 8900'), '+12345678901');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'Test@1234');
    const btns = getAllByText('Create Account');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('John Doe', 'john@test.com', 'Test@1234', '+12345678901');
    });
  });

  it('navigates to Login when Sign In is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Sign In'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('shows password strength indicator when typing password', () => {
    const { getByPlaceholderText, queryByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'weak');
    expect(queryByText('Weak')).toBeTruthy();
  });
});
