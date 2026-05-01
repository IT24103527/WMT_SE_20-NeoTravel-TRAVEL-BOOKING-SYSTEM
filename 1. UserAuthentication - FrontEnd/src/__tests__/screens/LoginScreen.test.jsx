import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../screens/auth/LoginScreen';
import { AuthContext } from '../../context/AuthContext';

const mockLogin = jest.fn();
const mockContinueAsGuest = jest.fn();
const mockNavigation = { navigate: jest.fn() };

const wrapper = ({ children }) => (
  <AuthContext.Provider value={{
    login: mockLogin,
    continueAsGuest: mockContinueAsGuest,
    user: null, loading: false, isGuest: false,
  }}>
    {children}
  </AuthContext.Provider>
);

const renderScreen = () =>
  render(<LoginScreen navigation={mockNavigation} />, { wrapper });

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Sign In button', () => {
    const { getAllByText } = renderScreen();
    expect(getAllByText('Sign In').length).toBeGreaterThanOrEqual(1);
  });

  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = renderScreen();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Your password')).toBeTruthy();
  });

  it('renders NeoTravel brand', () => {
    const { getByText } = renderScreen();
    expect(getByText('NeoTravel')).toBeTruthy();
  });

  it('shows validation error when submitting empty form', async () => {
    const { getAllByText } = renderScreen();
    const btns = getAllByText('Sign In');
    fireEvent.press(btns[btns.length - 1]);
    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('calls login with email and password on valid submit', async () => {
    mockLogin.mockResolvedValueOnce({});
    const { getByPlaceholderText, getAllByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@test.com');
    fireEvent.changeText(getByPlaceholderText('Your password'), 'Test@1234');
    const btns = getAllByText('Sign In');
    fireEvent.press(btns[btns.length - 1]);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'Test@1234');
    });
  });

  it('navigates to Signup when Create Account is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create Account'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
  });

  it('calls continueAsGuest when guest button is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText(/Continue as Guest/i));
    expect(mockContinueAsGuest).toHaveBeenCalled();
  });
});
