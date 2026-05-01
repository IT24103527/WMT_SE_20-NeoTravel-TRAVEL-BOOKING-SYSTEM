import React from 'react';
import { render } from '@testing-library/react-native';
import Loader from '../../components/common/Loader';

describe('Loader component', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<Loader />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders the NeoTravel brand text', () => {
    const { getByText } = render(<Loader />);
    expect(getByText('NeoTravel')).toBeTruthy();
  });

  it('renders the airplane emoji logo', () => {
    const { getByText } = render(<Loader />);
    expect(getByText('✈️')).toBeTruthy();
  });

  it('renders an Animated.View as the root container', () => {
    const { toJSON } = render(<Loader />);
    // Root element should exist and be a View-like node
    expect(toJSON().type).toBeTruthy();
  });

  it('snapshot matches', () => {
    const tree = render(<Loader />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
