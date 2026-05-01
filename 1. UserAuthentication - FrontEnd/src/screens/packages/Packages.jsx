// src/screens/packages/Packages.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getAllPackages } from '../../api/package.api';
import { createBooking } from '../../api/booking.api';
import { colors, shadowSm } from '../../utils/theme';

export default function Packages() {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null); // packageId being booked

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data } = await getAllPackages();
      setPackages(data.data || data); // handle both response formats
    } catch (err) {
      Alert.alert('Error', 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = async (pkg) => {
    Alert.alert(
      'Book Package',
      `Confirm booking for "${pkg.title}"?\nPrice: $${pkg.price}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setBookingLoading(pkg._id);
            try {
              await createBooking({
                packageId: pkg._id,
                bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default +7 days
                travelers: 1
              });
              Alert.alert('Success', 'Booking created successfully!', [
                { text: 'View My Bookings', onPress: () => navigation.navigate('Bookings') }
              ]);
            } catch (err) {
              Alert.alert('Failed', err.response?.data?.message || 'Could not create booking');
            } finally {
              setBookingLoading(null);
            }
          }
        }
      ]
    );
  };

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Available Travel Packages</Text>

      {packages.length === 0 ? (
        <Text style={styles.empty}>No packages available at the moment</Text>
      ) : (
        packages.map((pkg) => (
          <View key={pkg._id} style={styles.card}>
            {pkg.image && (
              <Image source={{ uri: pkg.image }} style={styles.image} />
            )}
            <View style={styles.content}>
              <Text style={styles.title}>{pkg.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {pkg.description}
              </Text>
              <Text style={styles.price}>${pkg.price}</Text>

              <Button
                title={bookingLoading === pkg._id ? "Booking..." : "Book Now"}
                onPress={() => handleBookNow(pkg)}
                loading={bookingLoading === pkg._id}
                style={styles.bookBtn}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 16 },
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    ...shadowSm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: { padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
  },
  bookBtn: { marginTop: 8 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 50,
  },
});