import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { getToken, getRefreshToken } from '../../utils/storage';
import { colors, shadowSm } from '../../utils/theme';

// Decode JWT payload without verifying signature (UI display only)
const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const getTimeRemaining = (exp) => {
  if (!exp) return 'N/A';
  const now     = Math.floor(Date.now() / 1000);
  const diff    = exp - now;
  if (diff <= 0) return 'Expired';
  if (diff < 60) return `${diff}s remaining`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s remaining`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m remaining`;
  return `${Math.floor(diff / 86400)}d ${Math.floor((diff % 86400) / 3600)}h remaining`;
};

const maskToken = (token) => {
  if (!token) return 'Not found';
  return token.slice(0, 20) + '...' + token.slice(-10);
};

export default function TokenInfoScreen() {
  const [accessPayload,  setAccessPayload]  = useState(null);
  const [refreshPayload, setRefreshPayload] = useState(null);
  const [accessToken,    setAccessToken]    = useState('');
  const [refreshToken,   setRefreshToken]   = useState('');
  const [tick, setTick] = useState(0);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const load = async () => {
      const at = await getToken();
      const rt = await getRefreshToken();
      setAccessToken(at  || '');
      setRefreshToken(rt || '');
      setAccessPayload(at  ? decodeJWT(at)  : null);
      setRefreshPayload(rt ? decodeJWT(rt) : null);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 130 }),
      ]).start();
    };
    load();
    // Refresh countdown every second
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const isExpired = (exp) => exp && Math.floor(Date.now() / 1000) > exp;

  const InfoRow = ({ label, value, mono = false, highlight }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[
        styles.infoValue,
        mono && styles.monoValue,
        highlight === 'success' && { color: colors.success },
        highlight === 'danger'  && { color: colors.danger },
        highlight === 'warning' && { color: colors.warning },
      ]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Access Token Card */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>Access Token</Text>
        <View style={[styles.card, isExpired(accessPayload?.exp) && styles.cardExpired]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isExpired(accessPayload?.exp) ? colors.danger : colors.success }]} />
            <Text style={[styles.statusText, { color: isExpired(accessPayload?.exp) ? colors.danger : colors.success }]}>
              {isExpired(accessPayload?.exp) ? 'Expired' : 'Active'}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>JWT</Text>
            </View>
          </View>

          <InfoRow label="Token (masked)" value={maskToken(accessToken)} mono />
          <InfoRow label="User ID"        value={accessPayload?.id || 'N/A'} mono />
          <InfoRow label="Issued At"      value={formatDate(accessPayload?.iat)} />
          <InfoRow label="Expires At"     value={formatDate(accessPayload?.exp)} />
          <InfoRow
            label="Time Remaining"
            value={getTimeRemaining(accessPayload?.exp)}
            highlight={isExpired(accessPayload?.exp) ? 'danger' : 'success'}
          />
          <InfoRow label="Algorithm"      value="HS256" />
          <InfoRow label="Type"           value="Access Token" />
          <InfoRow label="Lifetime"       value="15 minutes" />
        </View>
      </Animated.View>

      {/* Refresh Token Card */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>Refresh Token</Text>
        <View style={[styles.card, isExpired(refreshPayload?.exp) && styles.cardExpired]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isExpired(refreshPayload?.exp) ? colors.danger : colors.primary }]} />
            <Text style={[styles.statusText, { color: isExpired(refreshPayload?.exp) ? colors.danger : colors.primary }]}>
              {isExpired(refreshPayload?.exp) ? 'Expired' : 'Active'}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>JWT</Text>
            </View>
          </View>

          <InfoRow label="Token (masked)" value={maskToken(refreshToken)} mono />
          <InfoRow label="User ID"        value={refreshPayload?.id || 'N/A'} mono />
          <InfoRow label="Issued At"      value={formatDate(refreshPayload?.iat)} />
          <InfoRow label="Expires At"     value={formatDate(refreshPayload?.exp)} />
          <InfoRow
            label="Time Remaining"
            value={getTimeRemaining(refreshPayload?.exp)}
            highlight={isExpired(refreshPayload?.exp) ? 'danger' : 'warning'}
          />
          <InfoRow label="Algorithm"      value="HS256" />
          <InfoRow label="Type"           value="Refresh Token" />
          <InfoRow label="Lifetime"       value="7 days" />
        </View>
      </Animated.View>

      {/* How it works */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>How JWT Works Here</Text>
        <View style={styles.card}>
          {[
            { step: '1', title: 'Login / Signup',      desc: 'Server issues Access Token (15min) + Refresh Token (7d)' },
            { step: '2', title: 'API Requests',        desc: 'Access Token sent in Authorization: Bearer header' },
            { step: '3', title: 'Token Expires',       desc: 'App auto-calls /auth/refresh with Refresh Token' },
            { step: '4', title: 'New Tokens Issued',   desc: 'Both tokens rotated — old refresh token invalidated' },
            { step: '5', title: 'Logout',              desc: 'Refresh Token cleared from server + device storage' },
          ].map(item => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{item.step}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Storage info */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.sectionTitle}>Token Storage</Text>
        <View style={styles.card}>
          <InfoRow label="Storage Method"  value="expo-secure-store" />
          <InfoRow label="Access Key"      value="neotravel_access"  mono />
          <InfoRow label="Refresh Key"     value="neotravel_refresh" mono />
          <InfoRow label="Encryption"      value="AES-256 (device keychain)" highlight="success" />
        </View>
      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  scroll:        { padding: 20, paddingBottom: 48 },
  section:       { marginBottom: 20 },
  sectionTitle:  { fontSize: 11, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },

  card:          { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  cardExpired:   { borderColor: colors.danger + '55' },

  statusRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  statusDot:     { width: 10, height: 10, borderRadius: 5 },
  statusText:    { fontSize: 13, fontWeight: '700', flex: 1 },
  typeBadge:     { backgroundColor: colors.success + '22', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { color: colors.success, fontSize: 11, fontWeight: '700' },

  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:     { fontSize: 12, color: colors.textSecondary, fontWeight: '600', flex: 1 },
  infoValue:     { fontSize: 12, color: colors.textPrimary, flex: 2, textAlign: 'right' },
  monoValue:     { fontFamily: 'monospace', fontSize: 11, color: colors.primary },

  stepRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  stepNum:       { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumText:   { color: colors.primary, fontSize: 12, fontWeight: '800' },
  stepInfo:      { flex: 1 },
  stepTitle:     { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  stepDesc:      { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
});
