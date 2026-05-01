import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/common/Button';

describe('Button component', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────
  it('renders title text', () => {
    const { getByText } = render(<Button title="Sign In" onPress={() => {}} />);
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('renders icon when icon prop is provided', () => {
    const { getByText } = render(<Button title="Go" onPress={() => {}} icon="🚀" />);
    expect(getByText('🚀')).toBeTruthy();
  });

  it('does not render icon when icon prop is omitted', () => {
    const { queryByText } = render(<Button title="Go" onPress={() => {}} />);
    expect(queryByText('🚀')).toBeNull();
  });

  it('renders as an accessible button role', () => {
    const { getByRole } = render(<Button title="Submit" onPress={() => {}} />);
    expect(getByRole('button')).toBeTruthy();
  });

  // ── Loading state ──────────────────────────────────────────────────────────
  it('shows ActivityIndicator when loading is true', () => {
    const { UNSAFE_getByType, queryByText } = render(
      <Button title="Submit" onPress={() => {}} loading={true} />
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText('Submit')).toBeNull();
  });

  it('hides title text when loading', () => {
    const { queryByText } = render(
      <Button title="Save" onPress={() => {}} loading={true} />
    );
    expect(queryByText('Save')).toBeNull();
  });

  it('is disabled when loading is true', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Button title="Submit" onPress={onPress} loading={true} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  // ── Press interactions ─────────────────────────────────────────────────────
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPress} />);
    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress only once per tap', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  // ── Variants ───────────────────────────────────────────────────────────────
  it('renders primary variant by default', () => {
    const { getByRole } = render(<Button title="Primary" onPress={() => {}} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('renders danger variant without crashing', () => {
    const { getByText } = render(<Button title="Delete" onPress={() => {}} variant="danger" />);
    expect(getByText('Delete')).toBeTruthy();
  });

  it('renders secondary variant without crashing', () => {
    const { getByText } = render(<Button title="Cancel" onPress={() => {}} variant="secondary" />);
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('renders ghost variant without crashing', () => {
    const { getByText } = render(<Button title="Ghost" onPress={() => {}} variant="ghost" />);
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('renders success variant without crashing', () => {
    const { getByText } = render(<Button title="Done" onPress={() => {}} variant="success" />);
    expect(getByText('Done')).toBeTruthy();
  });

  it('falls back to primary for unknown variant', () => {
    const { getByText } = render(<Button title="Fallback" onPress={() => {}} variant="unknown" />);
    expect(getByText('Fallback')).toBeTruthy();
  });

  // ── Snapshot ───────────────────────────────────────────────────────────────
  it('matches snapshot for primary variant', () => {
    const tree = render(<Button title="Snapshot" onPress={() => {}} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
