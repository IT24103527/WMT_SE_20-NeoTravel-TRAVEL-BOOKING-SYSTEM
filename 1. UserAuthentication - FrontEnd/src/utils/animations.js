import { Animated, Easing } from 'react-native';

// ── Fade in from bottom (screen entry) ──────────────────────────────────────
export const useFadeSlideIn = (delay = 0) => {
  const opacity   = new Animated.Value(0);
  const translateY = new Animated.Value(24);

  const animate = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 420, delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 420, delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { opacity, translateY, animate };
};

// ── Scale pop (for cards/modals) ─────────────────────────────────────────────
export const useScalePop = (delay = 0) => {
  const scale   = new Animated.Value(0.92);
  const opacity = new Animated.Value(0);

  const animate = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1, delay,
        useNativeDriver: true,
        tension: 80, friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 300, delay,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scale, opacity, animate };
};

// ── Stagger children (for lists) ─────────────────────────────────────────────
export const staggeredFade = (count, baseDelay = 60) =>
  Array.from({ length: count }, (_, i) => {
    const opacity    = new Animated.Value(0);
    const translateY = new Animated.Value(16);
    return { opacity, translateY, delay: i * baseDelay };
  });

export const runStagger = (items) => {
  Animated.stagger(
    60,
    items.map(({ opacity, translateY, delay }) =>
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ])
    )
  ).start();
};
