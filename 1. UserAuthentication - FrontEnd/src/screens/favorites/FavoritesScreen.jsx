// src/screens/favorites/FavoritesScreen.jsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Loader from '../../components/common/Loader';
import { getMyFavorites, removeFavorite } from '../../api/favorite.api';
import { colors, shadowSm } from '../../utils/theme';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState(null); // packageId being removed

  // Reload every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data } = await getMyFavorites();
      setFavorites(data.data?.favorites || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (pkg) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${pkg.title}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(pkg._id);
            try {
              await removeFavorite(pkg._id);
              setFavorites((prev) => prev.filter((f) => f._id !== pkg._id));
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not remove favorite');
            } finally {
              setRemoving(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Favorites</Text>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the ❤️ on any package to save it here for later.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Packages')}
          >
            <Text style={styles.browseBtnText}>Browse Packages</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.favoriteId || item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="image-outline" size={36} color={colors.border} />
                </View>
              )}

              {/* Remove heart button */}
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => handleRemove(item)}
                disabled={removing === item._id}
              >
                <Ionicons
                  name={removing === item._id ? 'heart-dislike' : 'heart'}
                  size={22}
                  color={removing === item._id ? colors.textMuted : colors.danger}
                />
              </TouchableOpacity>

              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

                {item.destination ? (
                  <View style={styles.destinationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.destination}>{item.destination}</Text>
                  </View>
                ) : null}

                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.footer}>
                  <Text style={styles.price}>${item.price}</Text>
                  {item.duration ? (
                    <Text style={styles.duration}>{item.duration} days</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => navigation.navigate('PackageDetails', { packageId: item._id })}
                >
                  <Text style={styles.detailsBtnText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },

  // ── Empty state ─────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  browseBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // ── List ────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // ── Card ────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSm,
  },
  image: {
    width: '100%',
    height: 170,
    backgroundColor: colors.surfaceHigh,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Heart remove button ──────────────────────────────────────────
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSm,
  },

  cardBody: {
    padding: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  destination: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  duration: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsBtn: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
