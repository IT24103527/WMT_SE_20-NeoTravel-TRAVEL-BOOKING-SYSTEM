import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ActivityIndicator, ScrollView, Animated } from 'react-native';
import Button from '../../components/common/Button';
import { getMe, updatePrivacy } from '../../api/auth.api';
import { colors, shadowSm } from '../../utils/theme';

export default function PrivacyScreen() {
  const [profileVisible, setProfileVisible] = useState(true);
  const [showEmail, setShowEmail]           = useState(false);
  const [showPhone, setShowPhone]           = useState(false);
  const [showLastSeen, setShowLastSeen]     = useState(true);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMe();
        const p = data.data?.privacy;
        if (p) {
          setProfileVisible(p.profileVisible ?? true);
          setShowEmail(p.showEmail ?? false);
          setShowPhone(p.showPhone ?? false);
          setShowLastSeen(p.showLastSeen ?? true);
        }
      } catch {}
      finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 130 }),
        ]).start();
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePrivacy({ profileVisible, showEmail, showPhone, showLastSeen });
      Alert.alert('Saved', 'Privacy settings updated.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );

  const rows = [
    { label: 'Public Profile',   sub: 'Allow others to view your profile',   value: profileVisible, setter: setProfileVisible },
    { label: 'Show Email',       sub: 'Display email on your public profile', value: showEmail,      setter: setShowEmail      },
    { label: 'Show Phone',       sub: 'Display phone on your public profile', value: showPhone,      setter: setShowPhone      },
    { label: 'Show Last Seen',   sub: 'Let others see when you were active',  value: showLastSeen,   setter: setShowLastSeen   },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={styles.rowText}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.sub}>{r.sub}</Text>
            </View>
            <Switch
              value={r.value}
              onValueChange={r.setter}
              trackColor={{ false: colors.border, true: colors.primary + '88' }}
              thumbColor={r.value ? colors.primary : colors.textMuted}
            />
          </View>
        ))}
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Button title="Save Privacy Settings" onPress={handleSave} loading={saving} style={styles.btn} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card:   { backgroundColor: colors.card, borderRadius: 20, padding: 4, borderWidth: 1, borderColor: colors.border, ...shadowSm, marginBottom: 16 },
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText:{ flex: 1 },
  label:  { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sub:    { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  btn:    { marginTop: 4 },
});
