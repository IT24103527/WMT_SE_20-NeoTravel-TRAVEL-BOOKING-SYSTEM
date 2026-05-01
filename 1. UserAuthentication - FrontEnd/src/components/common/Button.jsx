import { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Animated, View } from 'react-native';
import { colors } from '../../utils/theme';

const variants = {
  primary:   { bg: colors.primary,      text: colors.bg },
  success:   { bg: colors.success,      text: colors.bg },
  danger:    { bg: 'transparent',       text: colors.danger,       border: colors.danger },
  secondary: { bg: colors.surfaceHigh,  text: colors.textSecondary, border: colors.border },
  ghost:     { bg: 'transparent',       text: colors.textSecondary, border: colors.border },
};

export default function Button({ title, onPress, loading = false, style, variant = 'primary', icon }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 0.96, useNativeDriver: true, speed: 80, bounciness: 0 }),
      Animated.timing(opacity, { toValue: 0.85, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const v = variants[variant] || variants.primary;

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }, style]}>
      <TouchableOpacity
        style={[
          styles.btn,
          { backgroundColor: v.bg },
          v.border && { borderWidth: 1.5, borderColor: v.border },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading}
        activeOpacity={1}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[styles.text, { color: v.text }]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn:   { paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon:  { fontSize: 16 },
  text:  { fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
});
