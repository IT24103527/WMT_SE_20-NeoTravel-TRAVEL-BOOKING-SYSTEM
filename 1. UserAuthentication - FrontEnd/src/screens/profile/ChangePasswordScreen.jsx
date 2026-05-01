import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { changePassword } from '../../api/auth.api';
import { validatePassword } from '../../utils/validators';
import { colors, shadowSm } from '../../utils/theme';

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent]     = useState('');
  const [newPwd, setNewPwd]       = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 130 }),
    ]).start();
  }, []);

  const handleChange = async () => {
    const errs = {};
    if (!current) errs.current = 'Current password is required';
    const pwErr = validatePassword(newPwd);
    if (pwErr) errs.newPwd = pwErr;
    if (newPwd !== confirm) errs.confirm = 'Passwords do not match';
    if (newPwd === current) errs.newPwd = 'New password must differ from current';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setLoading(true);
      await changePassword({ currentPassword: current, newPassword: newPwd });
      Alert.alert('Success', 'Password changed. Please sign in again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <Text style={styles.cardSub}>Your new password must be different from the current one.</Text>

          <InputField label="Current Password" placeholder="Your current password" value={current} onChangeText={setCurrent} secureTextEntry error={errors.current} />
          <InputField label="New Password" placeholder="Create a strong password" value={newPwd} onChangeText={setNewPwd} secureTextEntry error={errors.newPwd} />
          <InputField label="Confirm New Password" placeholder="Repeat new password" value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} />

          {/* Password rules */}
          <View style={styles.rulesBox}>
            {[
              { rule: 'At least 8 characters',         pass: newPwd.length >= 8 },
              { rule: 'One uppercase letter',           pass: /[A-Z]/.test(newPwd) },
              { rule: 'One number',                     pass: /[0-9]/.test(newPwd) },
              { rule: 'One special character (!@#...)', pass: /[!@#$%^&*]/.test(newPwd) },
            ].map(r => (
              <View key={r.rule} style={styles.ruleRow}>
                <Text style={[styles.ruleIcon, { color: r.pass ? colors.success : colors.textMuted }]}>{r.pass ? '✓' : '○'}</Text>
                <Text style={[styles.ruleText, r.pass && { color: colors.success }]}>{r.rule}</Text>
              </View>
            ))}
          </View>

          <Button title="Update Password" onPress={handleChange} loading={loading} style={styles.btn} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  scroll:    { flexGrow: 1, padding: 24 },
  card:      { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  cardSub:   { fontSize: 13, color: colors.textSecondary, marginBottom: 24, lineHeight: 18 },
  rulesBox:  { backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14, marginBottom: 14, gap: 6 },
  ruleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleIcon:  { fontSize: 12, fontWeight: '700', width: 14 },
  ruleText:  { fontSize: 12, color: colors.textMuted },
  btn:       { marginTop: 8 },
});
