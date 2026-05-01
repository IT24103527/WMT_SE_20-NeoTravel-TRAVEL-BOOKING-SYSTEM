import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validatePassword, validatePhone, validateUsername } from '../../utils/validators';
import { colors, shadowSm } from '../../utils/theme';

const getStrength = (pwd) => {
  if (!pwd)          return { level: 0, label: '',       color: colors.border  };
  if (pwd.length < 6) return { level: 1, label: 'Weak',  color: colors.danger  };
  if (pwd.length < 10)return { level: 2, label: 'Fair',  color: colors.warning };
  if (pwd.length < 14)return { level: 3, label: 'Good',  color: colors.info    };
  return                     { level: 4, label: 'Strong',color: colors.success };
};

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched]   = useState({});

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, []);

  // Live validation after field is touched
  const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

  const handleChange = (field, val, setter, validator) => {
    setter(val);
    if (touched[field]) setErrors(e => ({ ...e, [field]: validator(val) }));
  };

  const validate = () => {
    const errs = {
      username: validateUsername(username),
      email:    validateEmail(email),
      phone:    validatePhone(phone),
      password: validatePassword(password),
    };
    setErrors(errs);
    setTouched({ username: true, email: true, phone: true, password: true });
    return !Object.values(errs).some(Boolean);
  };

  const handleSignup = async () => {
    setSubmitError('');
    if (!validate()) return;
    try {
      setLoading(true);
      await signup(username, email, password, phone);
      navigation.navigate('VerifyEmail', { email });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Unable to connect. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoMark}>NT</Text>
          </View>
          <Text style={styles.brand}>NeoTravel</Text>
          <Text style={styles.tagline}>Create your travel identity</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSub}>Join millions of travelers worldwide</Text>

          {submitError ? (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>⚠  {submitError}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <InputField
              icon="A"
              label="Full Name"
              placeholder="Your display name"
              value={username}
              onChangeText={(v) => handleChange('username', v, setUsername, validateUsername)}
              onBlur={() => { touch('username'); setErrors(e => ({ ...e, username: validateUsername(username) })); }}
              error={errors.username}
            />
            <InputField
              icon="@"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => handleChange('email', v, setEmail, validateEmail)}
              keyboardType="email-address"
              error={errors.email}
            />
            <InputField
              icon="#"
              label="Mobile Number"
              placeholder="+1 234 567 8900"
              value={phone}
              onChangeText={(v) => handleChange('phone', v, setPhone, validatePhone)}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <InputField
              icon="•••"
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={(v) => handleChange('password', v, setPassword, validatePassword)}
              secureTextEntry
              error={errors.password}
            />
          </View>

          {/* Password strength */}
          {password.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map(i => (
                  <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength.level ? strength.color : colors.border }]} />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          {/* Password rules hint */}
          <View style={styles.rulesBox}>
            {[
              { rule: 'At least 8 characters',          pass: password.length >= 8 },
              { rule: 'One uppercase letter (A–Z)',      pass: /[A-Z]/.test(password) },
              { rule: 'One number (0–9)',                pass: /[0-9]/.test(password) },
              { rule: 'One special character (!@#...)',  pass: /[!@#$%^&*]/.test(password) },
            ].map(r => (
              <View key={r.rule} style={styles.ruleRow}>
                <Text style={[styles.ruleIcon, { color: r.pass ? colors.success : colors.textMuted }]}>
                  {r.pass ? '✓' : '○'}
                </Text>
                <Text style={[styles.ruleText, r.pass && { color: colors.success }]}>{r.rule}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.terms}>
            By creating an account you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <Button title="Create Account" onPress={handleSignup} loading={loading} style={styles.mainBtn} />
        </Animated.View>

        <Animated.View style={[styles.footerRow, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>Already have an account?  </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  scroll:        { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  header:        { alignItems: 'center', marginBottom: 40 },
  logoWrap:      { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 18, ...shadowSm },
  logoMark:      { fontSize: 20, fontWeight: '900', color: colors.bg, letterSpacing: 1 },
  brand:         { fontSize: 30, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5 },
  tagline:       { fontSize: 14, color: colors.textSecondary, marginTop: 6 },

  card:          { backgroundColor: colors.card, borderRadius: 28, padding: 28, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  cardTitle:     { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  cardSub:       { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },

  alertBox:      { backgroundColor: colors.danger + '18', borderWidth: 1, borderColor: colors.danger + '44', borderRadius: 12, padding: 12, marginBottom: 16 },
  alertText:     { color: colors.danger, fontSize: 13, fontWeight: '500' },

  fields:        { gap: 4 },

  strengthWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 12 },
  strengthBars:  { flex: 1, flexDirection: 'row', gap: 6 },
  strengthBar:   { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', width: 44, textAlign: 'right' },

  rulesBox:      { backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14, marginBottom: 14, gap: 6 },
  ruleRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleIcon:      { fontSize: 12, fontWeight: '700', width: 14 },
  ruleText:      { fontSize: 12, color: colors.textMuted },

  terms:         { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 4 },
  termsLink:     { color: colors.primary, fontWeight: '600' },

  mainBtn:       { marginTop: 8 },

  footerRow:     { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText:    { color: colors.textSecondary, fontSize: 14 },
  footerLink:    { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
