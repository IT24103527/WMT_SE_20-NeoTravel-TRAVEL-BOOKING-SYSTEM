import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { colors } from '../../utils/theme';

export default function SkeletonLoader({ width = '100%', height = 20, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity }, style]}
    />
  );
}
