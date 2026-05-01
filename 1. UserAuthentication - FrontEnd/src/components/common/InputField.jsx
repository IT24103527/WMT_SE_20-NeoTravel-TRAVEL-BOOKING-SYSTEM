import { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '../../utils/theme';

export default function InputField({
  placeholder, value, onChangeText,
  secureTextEntry = false, keyboardType = 'default',
  label, icon, error,
}) {
  const [focused, setFocused]   = useState(false);
  const [visible, setVisible]   = useState(!secureTextEntry);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.danger : colors.border, error ? colors.danger : colors.primary],
  });

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, focused && styles.labelFocused, error && styles.labelError]}>{label}</Text>
      )}
      <Animated.View style={[styles.inputRow, { borderColor }]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !visible}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onFocus={onFocus}
          onBlur={onBlur}
          accessibilityLabel={label || placeholder}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{visible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:      { marginBottom: 16 },
  label:        { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 },
  labelFocused: { color: colors.primary },
  inputRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, backgroundColor: colors.surfaceHigh, minHeight: 52 },
  icon:         { fontSize: 16, marginRight: 10, opacity: 0.7 },
  input:        { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 14 },
  eyeBtn:       { padding: 4 },
  eyeIcon:      { fontSize: 16 },
  labelError:   { color: colors.danger },
  errorRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 5 },
  errorIcon:    { fontSize: 11, color: colors.danger },
  errorText:    { fontSize: 11, color: colors.danger, fontWeight: '500', flex: 1 },
});
