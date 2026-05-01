import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { verifyEmail, resendVerification } from '../../api/auth.api';
import useAuth from '../../hooks/useAuth';
import { getMe } from '../../api/auth.api';
import { colors, shadowSm } from '../../utils/theme';

export default function VerifyEmailScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const { setUser } = useAuth();
  const [otp, setOtp]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const timerRef  = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120, mass: 0.9 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 140 }),
    ]).start();
    timerRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) return Alert.alert('Error', 'Enter the 6-digit code');
    try {
      setLoading(true);
      await verifyEmail({ email, otp });
      // Fetch full user profile and set in context — navigates to MainNavigator
      const { data } = await getMe();
      setUser(data.data);
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setResendLoading(true);
      await resendVerification({ email });
      setCountdown(60);
      timerRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
      Alert.alert('Sent', 'A new code has been sent to your email.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>✉</Text>
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.sub}>We sent a 6-digit code to</Text>
          <Text style={styles.email}>{email}</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <InputField
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />
          <Button title="Verify Email" onPress={handleVerify} loading={loading} style={styles.btn} />

          <TouchableOpacity style={styles.resendRow} onPress={handleResend} disabled={countdown > 0 || resendLoading}>
            <Text style={[styles.resendText, countdown > 0 && { color: colors.textMuted }]}>
              {resendLoading ? 'Sending...' : countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header:     { alignItems: 'center', marginBottom: 40 },
  iconWrap:   { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '55', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconText:   { fontSize: 30, color: colors.primary },
  title:      { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  sub:        { fontSize: 14, color: colors.textSecondary },
  email:      { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  card:       { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  btn:        { marginTop: 8 },
  resendRow:  { alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  backRow:    { alignItems: 'center', marginTop: 28 },
  backText:   { color: colors.textSecondary, fontSize: 14 },
});
