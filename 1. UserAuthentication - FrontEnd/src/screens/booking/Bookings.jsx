import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Loader from '../../components/common/Loader';
import { getMyBookings, cancelBooking, deleteBooking } from '../../api/booking.api';
import { colors } from '../../utils/theme';
import { format } from 'date-fns';

export default function Bookings() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // useFocusEffect automatically triggers every time this screen is visited
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      // Don't show full screen loader if we already have bookings (pull to refresh UX)
      if (!bookings || bookings.length === 0) setLoading(true);
      const { data } = await getMyBookings();
      
      let fetchedBookings = [];
      if (data && Array.isArray(data.data)) {
        fetchedBookings = data.data;
      } else if (Array.isArray(data)) {
        fetchedBookings = data;
      }
      
      setBookings(fetchedBookings);
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

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to permanently delete this cancelled booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteBooking(id);
              fetchBookings(); // refresh list
            } catch (err) {
              Alert.alert('Error', 'Failed to delete booking');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  if (loading && bookings.length === 0) return <Loader />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>My Bookings Dashboard</Text>

        {(!bookings || bookings.length === 0) && !loading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>You haven't booked any packages yet.</Text>
          </View>
        ) : (
          (bookings || []).map((booking) => {
            const shortId = booking._id.substring(booking._id.length - 6).toUpperCase();
            
            return (
              <View key={booking._id} style={styles.card}>
                
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <Text style={styles.bookingId}>BKG-{shortId}</Text>
                  <View style={styles.badgesWrap}>
                    <View style={[styles.badge, booking.status === 'confirmed' ? styles.badgeConfirmed : booking.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending]}>
                      <Text style={[styles.badgeText, booking.status === 'confirmed' ? styles.badgeTextConfirmed : booking.status === 'cancelled' ? styles.badgeTextCancelled : styles.badgeTextPending]}>
                        {booking.status.toUpperCase()}
                      </Text>
                    </View>
                    {booking.paymentStatus === 'paid' && (
                      <View style={[styles.badge, styles.badgePaid]}>
                        <Text style={[styles.badgeText, styles.badgeTextPaid]}>PAID</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Package Title */}
                <Text style={styles.packageTitle}>{booking.package?.title || 'Unknown Package'}</Text>

                {/* Details Box */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailText}>Date: {format(new Date(booking.bookingDate), 'EEE MMM dd yyyy')}</Text>
                  <Text style={styles.detailText}>Travelers: {booking.travelers}</Text>
                  <Text style={styles.detailText}>Total: ${booking.totalPrice}</Text>
                  {booking.specialRequests ? (
                    <Text style={styles.detailText}>Note: {booking.specialRequests}</Text>
                  ) : null}
                </View>

                {/* Buttons */}
                {booking.status !== 'cancelled' && (
                  <View style={styles.actionsWrap}>
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(booking._id)}
                      disabled={cancellingId === booking._id}
                    >
                      <Text style={styles.cancelBtnText}>
                        {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                      </Text>
                    </TouchableOpacity>

                    {booking.paymentStatus === 'pending' && (
                      <TouchableOpacity 
                        style={styles.payBtn}
                        onPress={() => navigation.navigate('Payment', { bookingId: booking._id, amount: booking.totalPrice })}
                      >
                        <Text style={styles.payBtnText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Cancelled Delete Button */}
                {booking.status === 'cancelled' && (
                  <View style={styles.actionsWrap}>
                    <TouchableOpacity 
                      style={styles.cancelBtn}
                      onPress={() => handleDelete(booking._id)}
                      disabled={deletingId === booking._id}
                    >
                      <Text style={styles.cancelBtnText}>
                        {deletingId === booking._id ? 'Deleting...' : 'Delete Booking'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1e3a8a', marginBottom: 20, letterSpacing: -0.5 },
  emptyWrap: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16 },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  badgesWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgePending: { backgroundColor: '#e0f2fe' },
  badgeTextPending: { color: '#0284c7' },
  badgeConfirmed: { backgroundColor: '#e0f2fe' }, 
  badgeTextConfirmed: { color: '#0284c7' },
  badgePaid: { backgroundColor: '#dcfce7' },
  badgeTextPaid: { color: '#16a34a' },
  badgeCancelled: { backgroundColor: '#fee2e2' },
  badgeTextCancelled: { color: '#dc2626' },
  
  packageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  detailsBox: {
    backgroundColor: '#eff4f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailText: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 4,
    fontWeight: '500',
  },
  
  actionsWrap: {
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
  payBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});