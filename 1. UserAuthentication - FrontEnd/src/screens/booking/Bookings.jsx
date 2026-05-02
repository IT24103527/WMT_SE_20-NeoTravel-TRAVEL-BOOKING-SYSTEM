import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Loader from '../../components/common/Loader';
import { getBookings } from '../../api/booking.api';
import { colors, shadowSm } from '../../utils/theme';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await getBookings();
      setBookings(data.data || data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Bookings</Text>
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bookings found yet.</Text>
        </View>
      ) : (
        bookings.map((booking) => (
          <View key={booking._id} style={styles.card}>
            <Text style={styles.packageTitle}>{booking.package?.title || 'Untitled Package'}</Text>
            <Text style={styles.subtitle}>Booking Date: {new Date(booking.bookingDate).toLocaleDateString()}</Text>
            <Text style={styles.subtitle}>Travelers: {booking.travelers || 1}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    ...shadowSm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packageTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});
