// src/screens/booking/Bookings.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity
} from 'react-native';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getMyBookings, cancelBooking } from '../../api/booking.api';
import { colors } from '../../utils/theme';
import { format } from 'date-fns';   // you'll need to install this: npm install date-fns

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await getMyBookings();
      setBookings(data.data || data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (id) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(id);
            try {
              await cancelBooking(id);
              Alert.alert('Cancelled', 'Booking has been cancelled.');
              fetchBookings(); // refresh list
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel booking');
            } finally {
              setCancellingId(null);
            }
          }
        }
      ]
    );
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>My Bookings</Text>

      {bookings.length === 0 ? (
        <Text style={styles.empty}>You haven't booked any packages yet.</Text>
      ) : (
        bookings.map((booking) => (
          <View key={booking._id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.packageTitle}>
                {booking.package?.title || 'Package'}
              </Text>
              <Text style={[
                styles.status,
                booking.status === 'confirmed' && styles.confirmed,
                booking.status === 'cancelled' && styles.cancelled
              ]}>
                {booking.status.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.detail}>
              Date: {format(new Date(booking.bookingDate), 'dd MMM yyyy')}
            </Text>
            <Text style={styles.detail}>
              Travelers: {booking.travelers} • Total: ${booking.totalPrice}
            </Text>

            {booking.status !== 'cancelled' && (
              <TouchableOpacity 
                onPress={() => handleCancel(booking._id)}
                disabled={cancellingId === booking._id}
              >
                <Text style={styles.cancelText}>
                  {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  packageTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  status: { fontWeight: '700', fontSize: 13, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  confirmed: { backgroundColor: '#d4edda', color: '#155724' },
  cancelled: { backgroundColor: '#f8d7da', color: '#721c24' },
  detail: { fontSize: 15, color: colors.textSecondary, marginBottom: 6 },
  cancelText: { color: 'red', textAlign: 'center', marginTop: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 16, marginTop: 100 }
});