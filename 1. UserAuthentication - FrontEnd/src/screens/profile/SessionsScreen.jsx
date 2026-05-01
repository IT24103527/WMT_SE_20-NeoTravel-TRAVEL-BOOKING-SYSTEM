import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { getSessions, revokeSession, revokeAllSessions } from '../../api/auth.api';
import { colors, shadowSm } from '../../utils/theme';

function AnimatedSessionCard({ item, index, onRevoke }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 60, useNativeDriver: true, damping: 18, stiffness: 150 }),
    ]).start();
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.cardLeft}>
        <Text style={styles.device} numberOfLines={1}>{item.device || 'Unknown device'}</Text>
        <Text style={styles.ip}>{item.ip || 'Unknown IP'}</Text>
        <Text style={styles.date}>Active: {formatDate(item.lastActive)}</Text>
      </View>
      <TouchableOpacity style={styles.revokeBtn} onPress={() => onRevoke(item.sessionId)}>
        <Text style={styles.revokeText}>Revoke</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SessionsScreen() {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchSessions = async () => {
    try {
      const { data } = await getSessions();
      setSessions(data.data || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetchSessions();
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleRevoke = (sessionId) => {
    Alert.alert('Revoke Session', 'Sign out this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        try {
          await revokeSession(sessionId);
          setSessions(s => s.filter(x => x.sessionId !== sessionId));
        } catch {}
      }},
    ]);
  };

  const handleRevokeAll = () => {
    Alert.alert('Sign Out All', 'This will sign out all devices including this one.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out All', style: 'destructive', onPress: async () => {
        try {
          await revokeAllSessions();
          setSessions([]);
        } catch {}
      }},
    ]);
  };

  const renderItem = ({ item, index }) => (
    <AnimatedSessionCard item={item} index={index} onRevoke={handleRevoke} />
  );

  return (
    <View style={styles.root}>
      {sessions.length > 1 && (
        <Animated.View style={{ opacity: headerAnim }}>
          <TouchableOpacity style={styles.revokeAllBtn} onPress={handleRevokeAll}>
            <Text style={styles.revokeAllText}>Sign Out All Devices</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.sessionId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No active sessions</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  revokeAllBtn:  { margin: 16, padding: 14, borderRadius: 14, backgroundColor: colors.danger + '18', borderWidth: 1, borderColor: colors.danger + '44', alignItems: 'center' },
  revokeAllText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  list:          { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  cardLeft:      { flex: 1 },
  device:        { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  ip:            { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  date:          { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  revokeBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.danger + '18', borderWidth: 1, borderColor: colors.danger + '44' },
  revokeText:    { color: colors.danger, fontSize: 12, fontWeight: '700' },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyText:     { color: colors.textMuted, fontSize: 15 },
});
