import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../../utils/theme';

export default function Loader() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Ripple rings
    const ripple = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          ]),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    ripple(ring1, 0).start();
    ripple(ring2, 600).start();
  }, []);

  const ringStyle = (anim) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] }),
  });

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle(ring1)]} />
        <Animated.View style={[styles.ring, ringStyle(ring2)]} />
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>✈️</Text>
        </View>
      </View>
      <Text style={styles.text}>NeoTravel</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  center:    { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  ring:      { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.primary },
  logoWrap:  { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  logo:      { fontSize: 26 },
  text:      { color: colors.textSecondary, fontSize: 14, marginTop: 24, letterSpacing: 2, fontWeight: '600' },
});
