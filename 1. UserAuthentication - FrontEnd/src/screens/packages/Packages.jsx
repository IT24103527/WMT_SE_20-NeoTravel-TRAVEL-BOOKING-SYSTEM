// src/screens/packages/Packages.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getAllPackages } from '../../api/package.api';
import { createBooking } from '../../api/booking.api';
import { toggleFavorite, getMyFavorites } from '../../api/favorite.api';
import { colors, shadowSm } from '../../utils/theme';

export default function Packages() {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null);
  // favoriteIds: Set of packageIds the user has already favorited
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [togglingId, setTogglingId] = useState(null); // packageId being toggled

  useEffect(() => {
    fetchPackages();
    fetchFavoriteIds();
  }, []);

  const fetchFavoriteIds = async () => {
    try {
      const { data } = await getMyFavorites();
      const ids = (data.data?.favorites || []).map((f) => f._id);
      setFavoriteIds(new Set(ids));
    } catch {
      // Non-critical — silently ignore
    }
  };

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

  const handleToggleFavorite = async (pkg) => {
    setTogglingId(pkg._id);
    try {
      const { data } = await toggleFavorite(pkg._id);
      const isFav = data.data?.favorited;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(pkg._id) : next.delete(pkg._id);
        return next;
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update favorites');
    } finally {
      setTogglingId(null);
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
                bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                travelers: 1,
              });
              Alert.alert(
                'Success',
                'Booking created successfully!',
                [
                  { text: 'View My Bookings', onPress: () => navigation.navigate('Bookings') },
                  { text: 'OK', style: 'cancel' },
                ]
              );
            } catch (err) {
              Alert.alert('Failed', err.response?.data?.message || 'Could not create booking');
            } finally {
              setBookingLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Available Travel Packages</Text>

      {packages.length === 0 ? (
        <Text style={styles.empty}>No packages available at the moment</Text>
      ) : (
        packages.map((pkg) => (
          <View key={pkg._id} style={styles.card}>
            {pkg.image && (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: pkg.image }} style={styles.image} />
                {/* ❤️ Favorite toggle button */}
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => handleToggleFavorite(pkg)}
                  disabled={togglingId === pkg._id}
                >
                  <Ionicons
                    name={favoriteIds.has(pkg._id) ? 'heart' : 'heart-outline'}
                    size={22}
                    color={favoriteIds.has(pkg._id) ? colors.danger : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
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
              <Button
                title="View Details"
                onPress={() => navigation.navigate('PackageDetails', { packageId: pkg._id })}
                variant="secondary"
                style={styles.detailsBtn}
              />
              <Button
                title="Reviews"
                onPress={() => navigation.navigate('Reviews', { packageId: pkg._id, packageTitle: pkg.title })}
                variant="ghost"
                style={styles.detailsBtn}
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
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSm,
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
  detailsBtn: { marginTop: 10 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 50,
  },
});