import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validators';
import { colors, shadowSm } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [submitError, setSubmitError] = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, []);

  // Validate on change (after first submit attempt)
  const handleEmailChange = (val) => {
    setEmail(val);
    if (errors.email) setErrors(e => ({ ...e, email: validateEmail(val) }));
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (errors.password) setErrors(e => ({ ...e, password: validatePassword(val) }));
  };

  const validate = () => {
    const errs = {
      email:    validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(errs);
    return !errs.email && !errs.password;
  };

  const handleLogin = async () => {
    setSubmitError('');
    if (!validate()) return;
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Unable to connect. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoMark}>NT</Text>
          </View>
          <Text style={styles.brand}>NeoTravel</Text>
          <Text style={styles.tagline}>Your world, one tap away</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>Welcome back, traveler</Text>

          {/* Server error */}
          {submitError ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>⚠  {submitError}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <InputField
              icon="@"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              error={errors.email}
            />
            <InputField
              icon="•••"
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              error={errors.password}
            />
          </View>

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.mainBtn} />

          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OR</Text>
            <View style={styles.divLine} />
          </View>

          <View style={styles.socialRow}>
            {[{ icon: 'G', label: 'Google' }, { icon: 'A', label: 'Apple' }].map(s => (
              <TouchableOpacity key={s.label} style={styles.socialBtn} accessibilityLabel={`Sign in with ${s.label}`}>
                <Text style={styles.socialIconText}>{s.icon}</Text>
                <Text style={styles.socialLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.guestBtn} onPress={continueAsGuest}>
            <Text style={styles.guestText}>Continue as Guest  →</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footerRow, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>Don't have an account?  </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  header:      { alignItems: 'center', marginBottom: 40 },
  logoWrap:    { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 18, ...shadowSm },
  logoMark:    { fontSize: 20, fontWeight: '900', color: colors.bg, letterSpacing: 1 },
  brand:       { fontSize: 30, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5 },
  tagline:     { fontSize: 14, color: colors.textSecondary, marginTop: 6 },

  card:        { backgroundColor: colors.card, borderRadius: 28, padding: 28, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  cardTitle:   { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  cardSub:     { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },

  alertBox:    { backgroundColor: colors.danger + '18', borderWidth: 1, borderColor: colors.danger + '44', borderRadius: 12, padding: 12, marginBottom: 16 },
  alertText:   { color: colors.danger, fontSize: 13, fontWeight: '500' },

  fields:      { gap: 4 },

  forgotWrap:  { alignSelf: 'flex-end', marginTop: 4, marginBottom: 8 },
  forgotText:  { fontSize: 13, color: colors.primary, fontWeight: '600' },

  mainBtn:     { marginTop: 8 },

  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divLine:     { flex: 1, height: 1, backgroundColor: colors.border },
  divText:     { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginHorizontal: 14, letterSpacing: 1.5 },

  socialRow:   { flexDirection: 'row', gap: 12 },
  socialBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHigh, borderRadius: 14, paddingVertical: 13, borderWidth: 1, borderColor: colors.border, gap: 8 },
  socialIconText:{ fontSize: 14, fontWeight: '800', color: colors.textSecondary },
  socialLabel: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },

  guestBtn:    { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
  guestText:   { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },

  footerRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText:  { color: colors.textSecondary, fontSize: 14 },
  footerLink:  { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
