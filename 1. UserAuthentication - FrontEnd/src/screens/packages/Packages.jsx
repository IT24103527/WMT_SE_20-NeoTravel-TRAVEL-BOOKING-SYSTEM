// src/screens/packages/Packages.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Alert, TextInput, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { getAllPackages } from '../../api/package.api';
import { createBooking } from '../../api/booking.api';
import { toggleFavorite, getMyFavorites } from '../../api/favorite.api';
import { getImagesByPackage, resolveUploadUrl } from '../../api/image.api';
import { colors } from '../../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Tag pill helper ────────────────────────────────────────────────────────────
const TAG_STYLES = {
  beach:     { bg: '#E3F0FB', text: '#1A6FA8' },
  luxury:    { bg: '#F5EDE3', text: '#9A5020' },
  adventure: { bg: '#E8F5E9', text: '#2E7D32' },
  cultural:  { bg: '#F0ECF8', text: '#6540A8' },
  popular:   { bg: '#FFF3E0', text: '#E65100' },
  default:   { bg: '#EEEEE8', text: '#555' },
};

function Tag({ label, type = 'default' }) {
  const s = TAG_STYLES[type] ?? TAG_STYLES.default;
  return (
    <View style={[styles.tag, { backgroundColor: s.bg }]}>
      <Text style={[styles.tagText, { color: s.text }]}>{label}</Text>
    </View>
  );
}

// ── Helper: get categories array (compatibility with old single category) ─────
function getPackageCategories(pkg) {
  if (pkg.categories && Array.isArray(pkg.categories) && pkg.categories.length > 0) {
    return pkg.categories;
  }
  // Fallback for old data: convert single `category` string into array
  if (pkg.category && typeof pkg.category === 'string') {
    return [pkg.category];
  }
  return ['Popular'];
}

// ── Package card ───────────────────────────────────────────────────────────────
function PackageCard({ pkg, isFavorite, toggling, onFavorite, onBook, onDetails, bookingLoading }) {
  const categories = getPackageCategories(pkg);

  return (
    <View style={styles.card}>
      {/* Cover image section */}
      {pkg.image ? (
        <View style={styles.coverWrap}>
          <Image source={{ uri: pkg.image }} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.coverOverlay} />

          {/* Price badge bottom-left on image */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>${pkg.price}</Text>
          </View>

          {/* Heart button top-right */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={() => onFavorite(pkg)}
            disabled={toggling}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.danger : '#aaa'}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.pkgName} numberOfLines={1}>{pkg.title}</Text>
          {!pkg.image && (
            <Text style={styles.priceInline}>${pkg.price}</Text>
          )}
        </View>

        {/* Tags: show all categories */}
        <View style={styles.tags}>
          {categories.map((cat) => (
            <Tag key={cat} label={cat} type={cat.toLowerCase()} />
          ))}
        </View>

        {/* Description */}
        <Text style={styles.desc} numberOfLines={2}>{pkg.description}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btnBook, bookingLoading && styles.btnDisabled]}
            onPress={() => onBook(pkg)}
            disabled={!!bookingLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnBookText}>
              {bookingLoading ? 'Booking…' : 'Book Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => onDetails(pkg)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnOutlineText}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews ghost link */}
        <TouchableOpacity style={styles.reviewsLink} activeOpacity={0.7}>
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text style={styles.reviewsText}>See Reviews</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function Packages() {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [togglingId, setTogglingId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ["All", "Popular", "Beach", "Adventure", "Cultural", "Luxury"];

  useEffect(() => {
    fetchPackages();
    fetchFavoriteIds();
  }, []);

  const fetchFavoriteIds = async () => {
    try {
      const { data } = await getMyFavorites();
      const ids = (data.data?.favorites || []).map((f) => f._id);
      setFavoriteIds(new Set(ids));
    } catch { /* non-critical */ }
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data } = await getAllPackages();
      const packageList = data.data || data;

      const packagesWithImages = await Promise.all(
        packageList.map(async (pkg) => {
          try {
            const imgRes = await getImagesByPackage(pkg._id);
            const cover = imgRes.data.coverImage || imgRes.data.images?.[0];
            return {
              ...pkg,
              image: cover ? resolveUploadUrl(cover.url) : null,
            };
          } catch {
            return { ...pkg, image: null };
          }
        })
      );

      setPackages(packagesWithImages);
    } catch {
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

  const handleBookNow = (pkg) => {
    navigation.navigate('CreateBooking', { package: pkg });
  };

  // Filter packages: search + category (multi‑category support)
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.title?.toLowerCase().includes(search.toLowerCase());
    const pkgCategories = getPackageCategories(pkg);
    const matchesCategory = selectedCategory === "All" || pkgCategories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Discover</Text>
          <Text style={styles.headerTitle}>Travel Packages</Text>
        </View>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#aaa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search destinations..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category Filter ── */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Package List ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPackages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="airplane-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No packages found</Text>
          </View>
        ) : (
          filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg._id}
              pkg={pkg}
              isFavorite={favoriteIds.has(pkg._id)}
              toggling={togglingId === pkg._id}
              bookingLoading={bookingLoading === pkg._id}
              onFavorite={handleToggleFavorite}
              onBook={handleBookNow}
              onDetails={(p) => navigation.navigate('PackageDetails', { packageId: p._id })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles (unchanged) ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  avatarBtn: { padding: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  coverWrap: { position: 'relative' },
  coverImage: { width: '100%', height: 200 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  priceBadge: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    backgroundColor: colors.primary,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  priceBadgeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: { padding: 18 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pkgName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, flex: 1, letterSpacing: -0.3 },
  priceInline: { fontSize: 20, fontWeight: '800', color: colors.primary, marginLeft: 8 },
  tags: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tagText: { fontSize: 11, fontWeight: '600' },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnBook: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnBookText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  btnOutline: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btnOutlineText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  reviewsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  reviewsText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  categorySection: { marginBottom: 14 },
  categoryScroll: { paddingHorizontal: 20, paddingRight: 28 },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: colors.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
});