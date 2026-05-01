import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import InputField from '../../components/common/InputField';

describe('InputField component', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────
  it('renders placeholder text', () => {
    const { getByPlaceholderText } = render(
      <InputField placeholder="Enter email" value="" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('renders label when provided', () => {
    const { getByText } = render(
      <InputField label="Email Address" placeholder="email" value="" onChangeText={() => {}} />
    );
    expect(getByText('Email Address')).toBeTruthy();
  });

  it('does not render label when label prop is omitted', () => {
    const { queryByText } = render(
      <InputField placeholder="email" value="" onChangeText={() => {}} />
    );
    // No label text should appear
    expect(queryByText('Email Address')).toBeNull();
  });

  it('renders icon text when icon prop is provided', () => {
    const { getByText } = render(
      <InputField icon="@" placeholder="email" value="" onChangeText={() => {}} />
    );
    expect(getByText('@')).toBeTruthy();
  });

  it('renders current value in the input', () => {
    const { getByDisplayValue } = render(
      <InputField placeholder="email" value="hello@test.com" onChangeText={() => {}} />
    );
    expect(getByDisplayValue('hello@test.com')).toBeTruthy();
  });

  // ── Interaction ────────────────────────────────────────────────────────────
  it('calls onChangeText when text changes', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <InputField placeholder="Type here" value="" onChangeText={onChange} />
    );
    fireEvent.changeText(getByPlaceholderText('Type here'), 'hello');
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onChangeText with empty string when cleared', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <InputField placeholder="Type here" value="existing" onChangeText={onChange} />
    );
    fireEvent.changeText(getByPlaceholderText('Type here'), '');
    expect(onChange).toHaveBeenCalledWith('');
  });

  // ── Error state ────────────────────────────────────────────────────────────
  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <InputField placeholder="email" value="" onChangeText={() => {}} error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('does not display error when error prop is null', () => {
    const { queryByText } = render(
      <InputField placeholder="email" value="" onChangeText={() => {}} error={null} />
    );
    expect(queryByText('Invalid email')).toBeNull();
  });

  it('does not display error when error prop is undefined', () => {
    const { queryByText } = render(
      <InputField placeholder="email" value="" onChangeText={() => {}} />
    );
    expect(queryByText('Invalid email')).toBeNull();
  });

  it('does not display error when error is empty string', () => {
    const { queryByText } = render(
      <InputField placeholder="email" value="" onChangeText={() => {}} error="" />
    );
    // Empty string is falsy — no error row should render
    expect(queryByText('')).toBeNull();
  });

  // ── Secure text entry ──────────────────────────────────────────────────────
  it('renders eye toggle icon for secureTextEntry', () => {
    const { getByText } = render(
      <InputField placeholder="password" value="" onChangeText={() => {}} secureTextEntry />
    );
    // Initially shows the reveal icon
    expect(getByText('👁️')).toBeTruthy();
  });

  it('does not render eye toggle when secureTextEntry is false', () => {
    const { queryByText } = render(
      <InputField placeholder="text" value="" onChangeText={() => {}} secureTextEntry={false} />
    );
    expect(queryByText('🙈')).toBeNull();
    expect(queryByText('👁️')).toBeNull();
  });

  it('toggles visibility icon when eye button is pressed', () => {
    const { getByText, queryByText } = render(
      <InputField placeholder="password" value="" onChangeText={() => {}} secureTextEntry />
    );
    // Initially shows 👁️ (reveal icon)
    expect(getByText('👁️')).toBeTruthy();
    // Press the eye icon text to toggle
    fireEvent.press(getByText('👁️'));
    // Now shows 🙈 (hide icon)
    expect(getByText('🙈')).toBeTruthy();
    expect(queryByText('👁️')).toBeNull();
  });

  // ── Snapshot ───────────────────────────────────────────────────────────────
  it('matches snapshot for basic input', () => {
    const tree = render(
      <InputField label="Email" placeholder="you@example.com" value="" onChangeText={() => {}} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
