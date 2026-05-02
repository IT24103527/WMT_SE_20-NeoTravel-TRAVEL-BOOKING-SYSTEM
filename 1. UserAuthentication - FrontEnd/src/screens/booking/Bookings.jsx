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
      const bookingsPayload = data?.bookings || data?.data || data;
      setBookings(Array.isArray(bookingsPayload) ? bookingsPayload : []);
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
        bookings.map((booking) => {
          const pkg = booking.package || {};
          const totalCost = (pkg.price || 0) * (booking.travelers || 1);
          return (
            <View key={booking._id} style={styles.card}>
              {/* Package Header */}
              <Text style={styles.packageTitle}>{pkg.title || 'Untitled Package'}</Text>
              
              {/* Destination */}
              {pkg.destination && (
                <Text style={styles.destination}>📍 {pkg.destination}</Text>
              )}
              
              {/* Description */}
              {pkg.description && (
                <Text style={styles.description} numberOfLines={2}>{pkg.description}</Text>
              )}
              
              {/* Divider */}
              <View style={styles.divider} />
              
              {/* Details Row 1 - Duration & Price */}
              <View style={styles.detailsRow}>
                {pkg.duration && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{pkg.duration} days</Text>
                  </View>
                )}
                {pkg.price && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Price/Person</Text>
                    <Text style={styles.detailValue}>${pkg.price}</Text>
                  </View>
                )}
              </View>
              
              {/* Details Row 2 - Travelers & Booking Date */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Travelers</Text>
                  <Text style={styles.detailValue}>{booking.travelers || 1}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Booked on</Text>
                  <Text style={styles.detailValue}>{new Date(booking.bookingDate).toLocaleDateString()}</Text>
                </View>
              </View>
              
              {/* Total Cost */}
              {pkg.price && (
                <View style={styles.totalCostContainer}>
                  <Text style={styles.totalLabel}>Total Cost</Text>
                  <Text style={styles.totalPrice}>${totalCost}</Text>
                </View>
              )}
            </View>
          );
        })
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
  packageTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  destination: { fontSize: 14, color: colors.primary, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  detailValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '700' },
  totalCostContainer: {
    backgroundColor: colors.primary + '15',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  totalPrice: { fontSize: 18, color: colors.primary, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});
