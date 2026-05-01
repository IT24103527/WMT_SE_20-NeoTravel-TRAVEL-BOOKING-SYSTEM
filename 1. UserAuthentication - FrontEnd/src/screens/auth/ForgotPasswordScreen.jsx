import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { forgotPassword } from '../../api/auth.api';
import { validateEmail } from '../../utils/validators';
import { colors, shadowSm } from '../../utils/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
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

  const handleSubmit = async () => {
    const err = validateEmail(email);
    if (err) return setError(err);
    setError('');
    try {
      setLoading(true);
      await forgotPassword({ email });
      Alert.alert('Code Sent', 'If that email exists, a reset code was sent.', [
        { text: 'Enter Code', onPress: () => navigation.navigate('ResetPassword', { email }) },
      ]);
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>🔓</Text>
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.sub}>Enter your email and we'll send you a reset code.</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          <InputField
            icon="@"
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            error={error}
          />
          <Button title="Send Reset Code" onPress={handleSubmit} loading={loading} style={styles.btn} />
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
  root:     { flex: 1, backgroundColor: colors.bg },
  scroll:   { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header:   { alignItems: 'center', marginBottom: 40 },
  iconWrap: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.warning + '22', borderWidth: 1, borderColor: colors.warning + '55', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconText: { fontSize: 30 },
  title:    { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  sub:      { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card:     { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  btn:      { marginTop: 8 },
  backRow:  { alignItems: 'center', marginTop: 28 },
  backText: { color: colors.textSecondary, fontSize: 14 },
});
