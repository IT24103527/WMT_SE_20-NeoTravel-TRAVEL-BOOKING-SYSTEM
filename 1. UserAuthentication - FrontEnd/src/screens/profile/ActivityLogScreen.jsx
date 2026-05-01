import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { getActivityLog, clearActivityLog } from '../../api/auth.api';
import { colors, shadowSm } from '../../utils/theme';

const ACTION_ICONS = {
  profile_updated:       '✏️',
  avatar_updated:        '📷',
  avatar_removed:        '🗑️',
  password_changed:      '🔑',
  preferences_updated:   '⚙️',
  privacy_updated:       '🔒',
  login_history_cleared: '🧹',
  session_revoked:       '📵',
  all_sessions_revoked:  '🚪',
  data_exported:         '📦',
  account_deactivated:   '⏸️',
  default:               '📋',
};

function AnimatedLogRow({ item, index, isLast }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 45, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 45, useNativeDriver: true, damping: 20, stiffness: 160 }),
    ]).start();
  }, []);

  const icon  = ACTION_ICONS[item.action] || ACTION_ICONS.default;
  const label = item.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()}  ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Animated.View style={[
      styles.row,
      isLast && { borderBottomWidth: 0 },
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.action}>{label}</Text>
        {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
        <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
      </View>
      {item.ip ? <Text style={styles.ip}>{item.ip}</Text> : null}
    </Animated.View>
  );
}

export default function ActivityLogScreen() {
  const [log, setLog]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchLog = async () => {
    try {
      const { data } = await getActivityLog();
      setLog(data.data || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetchLog();
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleClear = () => {
    Alert.alert('Clear Activity Log', 'Remove all activity records?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        try {
          await clearActivityLog();
          setLog([]);
        } catch {}
      }},
    ]);
  };

  const renderItem = ({ item, index }) => (
    <AnimatedLogRow item={item} index={index} isLast={index === log.length - 1} />
  );

  return (
    <View style={styles.root}>
      {log.length > 0 && (
        <Animated.View style={{ opacity: headerAnim }}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear Log</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={log}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLog(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No activity recorded yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  clearBtn:  { alignSelf: 'flex-end', margin: 16, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.danger + '55', backgroundColor: colors.danger + '11' },
  clearText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  list:      { paddingHorizontal: 20, paddingBottom: 32 },
  row:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap:  { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceHigh, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon:      { fontSize: 16 },
  info:      { flex: 1 },
  action:    { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  detail:    { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  time:      { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  ip:        { fontSize: 10, color: colors.textMuted, marginLeft: 8 },
  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
