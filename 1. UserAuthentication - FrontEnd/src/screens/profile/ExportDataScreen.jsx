import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Animated } from 'react-native';
import Button from '../../components/common/Button';
import { exportAccount } from '../../api/auth.api';
import { colors, shadowSm } from '../../utils/theme';

export default function ExportDataScreen() {
  const [loading, setLoading]   = useState(false);
  const [exported, setExported] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 130 }),
    ]).start();
  }, []);

  const handleExport = async () => {
    try {
      setLoading(true);
      const { data } = await exportAccount();
      setExported(data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.infoTitle}>Your Data</Text>
        <Text style={styles.infoText}>
          Export a copy of your NeoTravel account data including your profile, preferences, privacy settings, login history, and activity log.
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Button title="Export My Data" onPress={handleExport} loading={loading} style={styles.btn} />
      </Animated.View>

      {exported && (
        <Animated.View style={[styles.resultCard, { opacity: fadeAnim }]}>
          <Text style={styles.resultTitle}>Export Ready</Text>
          <Text style={styles.resultSub}>Exported at {new Date(exported.exportedAt).toLocaleString()}</Text>

          {[
            { label: 'Username',     value: exported.profile?.username },
            { label: 'Email',        value: exported.profile?.email },
            { label: 'Phone',        value: exported.profile?.phone || 'Not set' },
            { label: 'Member Since', value: new Date(exported.profile?.memberSince).toLocaleDateString() },
            { label: 'Verified',     value: exported.profile?.isVerified ? 'Yes' : 'No' },
            { label: 'Login Events', value: `${exported.loginHistory?.length || 0} records` },
            { label: 'Activity Log', value: `${exported.activityLog?.length || 0} events` },
          ].map(r => (
            <View key={r.label} style={styles.dataRow}>
              <Text style={styles.dataLabel}>{r.label}</Text>
              <Text style={styles.dataValue}>{r.value}</Text>
            </View>
          ))}
        </Animated.View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { padding: 20, paddingBottom: 40 },
  infoCard:    { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, ...shadowSm },
  infoTitle:   { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  infoText:    { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  btn:         { marginBottom: 20 },
  resultCard:  { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.primary + '44', ...shadowSm },
  resultTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  resultSub:   { fontSize: 12, color: colors.textMuted, marginBottom: 16 },
  dataRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  dataLabel:   { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  dataValue:   { fontSize: 13, color: colors.textPrimary },
});
