import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { verifyEmail, resendVerification } from '../../api/auth.api';
import { getMe } from '../../api/auth.api';
import { colors, shadowSm } from '../../utils/theme';

export default function VerifyEmailSettingsScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const { setUser } = useAuth();

  const [otp, setOtp]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown]   = useState(60);
  const timerRef = useRef(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120, mass: 0.9 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 140 }),
    ]).start();
    // Auto-send OTP on screen open
    handleResend(true);
    timerRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleResend = async (silent = false) => {
    try {
      setResendLoading(true);
      await resendVerification({ email });
      setCountdown(60);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
      if (!silent) Alert.alert('Sent', 'A new verification code has been sent to your email.');
    } catch (err) {
      if (!silent) Alert.alert('Error', err.response?.data?.message || 'Failed to send code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) return Alert.alert('Error', 'Enter the 6-digit code');
    try {
      setLoading(true);
      await verifyEmail({ email, otp });
      // Refresh user in context so isVerified updates everywhere
      const { data } = await getMe();
      setUser(data.data);
      Alert.alert('Verified!', 'Your email has been successfully verified.', [
        { text: 'Done', onPress: () => navigation.goBack() },
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

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>✉</Text>
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.sub}>A 6-digit code was sent to</Text>
          <Text style={styles.email}>{email}</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <InputField
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />

          <Button title="Verify Email" onPress={handleVerify} loading={loading} style={styles.btn} />

          <TouchableOpacity
            style={styles.resendRow}
            onPress={() => handleResend(false)}
            disabled={countdown > 0 || resendLoading}
          >
            <Text style={[styles.resendText, countdown > 0 && { color: colors.textMuted }]}>
              {resendLoading ? 'Sending...' : countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  header:     { alignItems: 'center', marginBottom: 32 },
  iconWrap:   { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.warning + '22', borderWidth: 1, borderColor: colors.warning + '55', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  iconText:   { fontSize: 30, color: colors.warning },
  title:      { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  sub:        { fontSize: 14, color: colors.textSecondary },
  email:      { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  card:       { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  btn:        { marginTop: 8 },
  resendRow:  { alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
