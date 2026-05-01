import React from 'react';
import { render } from '@testing-library/react-native';
import SkeletonLoader from '../../components/common/SkeletonLoader';

describe('SkeletonLoader component', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<SkeletonLoader />);
    expect(toJSON()).toBeTruthy();
  });

  it('applies custom width and height', () => {
    const { toJSON } = render(<SkeletonLoader width={200} height={40} />);
    const tree = toJSON();
    // Style may be a flat object or array — normalise to array
    const styles = [].concat(tree.props.style).filter(Boolean);
    const merged = Object.assign({}, ...styles);
    expect(merged.width).toBe(200);
    expect(merged.height).toBe(40);
  });

  it('applies custom borderRadius', () => {
    const { toJSON } = render(<SkeletonLoader borderRadius={20} />);
    const tree = toJSON();
    const styles = [].concat(tree.props.style).filter(Boolean);
    const merged = Object.assign({}, ...styles);
    expect(merged.borderRadius).toBe(20);
  });

  it('uses default width of 100%', () => {
    const { toJSON } = render(<SkeletonLoader />);
    const tree = toJSON();
    const styles = [].concat(tree.props.style).filter(Boolean);
    const merged = Object.assign({}, ...styles);
    expect(merged.width).toBe('100%');
  });

  it('uses default height of 20', () => {
    const { toJSON } = render(<SkeletonLoader />);
    const tree = toJSON();
    const styles = [].concat(tree.props.style).filter(Boolean);
    const merged = Object.assign({}, ...styles);
    expect(merged.height).toBe(20);
  });

  it('uses default borderRadius of 8', () => {
    const { toJSON } = render(<SkeletonLoader />);
    const tree = toJSON();
    const styles = [].concat(tree.props.style).filter(Boolean);
    const merged = Object.assign({}, ...styles);
    expect(merged.borderRadius).toBe(8);
  });

  it('applies extra style via style prop', () => {
    const { toJSON } = render(<SkeletonLoader style={{ marginBottom: 12 }} />);
    const tree = toJSON();
    const styles = [].concat(tree.props.style).filter(Boolean);
    const merged = Object.assign({}, ...styles);
    expect(merged.marginBottom).toBe(12);
  });

  it('snapshot matches', () => {
    const tree = render(<SkeletonLoader width={100} height={20} borderRadius={8} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
