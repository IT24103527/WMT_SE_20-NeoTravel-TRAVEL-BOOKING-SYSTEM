import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { getLoginHistory } from '../../api/auth.api';
import axiosInstance from '../../api/axiosInstance';
import { colors, shadowSm } from '../../utils/theme';

function AnimatedRow({ item, index, total }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay: index * 50, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, delay: index * 50, useNativeDriver: true, damping: 20, stiffness: 160 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.row,
      !item.success && styles.rowFailed,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <View style={[styles.dot, { backgroundColor: item.success ? colors.success : colors.danger }]} />
      <View style={styles.info}>
        <Text style={styles.device} numberOfLines={1}>{item.device || 'Unknown device'}</Text>
        <Text style={styles.ip}>{item.ip || 'Unknown IP'}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.status, { color: item.success ? colors.success : colors.danger }]}>
          {item.success ? 'Success' : 'Failed'}
        </Text>
        <Text style={styles.time}>
          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function LoginHistoryScreen() {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetch = async () => {
    try {
      const { data } = await getLoginHistory();
      setHistory(data.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetch();
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleClear = () => {
    Alert.alert('Clear History', 'Remove all login history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        try {
          await axiosInstance.delete('/users/login-history');
          setHistory([]);
        } catch {}
      }},
    ]);
  };

  const renderItem = ({ item, index }) => (
    <AnimatedRow item={item} index={index} total={history.length} />
  );

  return (
    <View style={styles.root}>
      {history.length > 0 && (
        <Animated.View style={{ opacity: headerAnim }}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear History</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <FlatList
        data={history}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No login history yet</Text>
            </View>
          )
        }
        ListHeaderComponent={
          loading && history.length === 0
            ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  list:       { padding: 20, gap: 10 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadowSm },
  rowFailed:  { borderColor: colors.danger + '44' },
  dot:        { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  info:       { flex: 1 },
  device:     { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  ip:         { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  right:      { alignItems: 'flex-end' },
  status:     { fontSize: 12, fontWeight: '700' },
  time:       { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyText:  { color: colors.textMuted, fontSize: 15 },
  clearBtn:   { alignSelf: 'flex-end', marginHorizontal: 20, marginTop: 12, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: colors.danger + '55', backgroundColor: colors.danger + '11' },
  clearText:  { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
