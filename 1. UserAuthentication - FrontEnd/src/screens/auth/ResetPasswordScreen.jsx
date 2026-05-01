import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { resetPassword } from '../../api/auth.api';
import { validatePassword } from '../../utils/validators';
import { colors, shadowSm } from '../../utils/theme';

export default function ResetPasswordScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const [otp, setOtp]               = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120, mass: 0.9 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 140 }),
    ]).start();
  }, []);

  const handleReset = async () => {
    const errs = {};
    if (!otp || otp.length !== 6) errs.otp = 'Enter the 6-digit code';
    const pwErr = validatePassword(newPassword);
    if (pwErr) errs.newPassword = pwErr;
    if (newPassword !== confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setLoading(true);
      await resetPassword({ email, otp, newPassword });
      Alert.alert('Success', 'Your password has been reset.', [
        { text: 'Sign In', onPress: () => navigation.replace('Login') },
      ]);
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>🔑</Text>
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.sub}>Enter the code sent to {email}</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <InputField label="Reset Code" placeholder="6-digit code" value={otp} onChangeText={setOtp} keyboardType="number-pad" error={errors.otp} />
          <InputField label="New Password" placeholder="Create a strong password" value={newPassword} onChangeText={setNewPassword} secureTextEntry error={errors.newPassword} />
          <InputField label="Confirm Password" placeholder="Repeat your password" value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} />
          <Button title="Reset Password" onPress={handleReset} loading={loading} style={styles.btn} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.bg },
  scroll:   { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header:   { alignItems: 'center', marginBottom: 40 },
  iconWrap: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.success + '22', borderWidth: 1, borderColor: colors.success + '55', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconText: { fontSize: 30 },
  title:    { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  sub:      { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  card:     { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  btn:      { marginTop: 8 },
  backRow:  { alignItems: 'center', marginTop: 28 },
  backText: { color: colors.textSecondary, fontSize: 14 },
});
