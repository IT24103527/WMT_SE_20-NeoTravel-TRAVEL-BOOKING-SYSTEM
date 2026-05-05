import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Loader from '../../components/common/Loader';
import { getPackageById } from '../../api/package.api';
import { getImagesByPackage, resolveUploadUrl, deleteImage } from '../../api/image.api';
import { getPackageReviews } from '../../api/review.api';
import { colors } from '../../utils/theme';

const screenWidth = Dimensions.get('window').width;

export default function PackageDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const packageId = route.params?.packageId;

  const [pkg, setPkg] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ reviewCount: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);

  const fetchPackageDetails = useCallback(async () => {
    if (!packageId) return;
    try {
      setLoading(true);
      const [packageRes, imagesRes, reviewsRes] = await Promise.all([
        getPackageById(packageId),
        getImagesByPackage(packageId),
        getPackageReviews(packageId),
      ]);

      const packageData = packageRes.data.data || packageRes.data;
      setPkg(packageData);

      const imagesData = imagesRes.data;
      if (imagesData.coverImage !== undefined) {
        setCoverImage(imagesData.coverImage);
        setGalleryImages(imagesData.galleryImages || []);
      } else {
        const allImages = imagesData.images || [];
        setCoverImage(null);
        setGalleryImages(allImages);
      }

      const reviewData = reviewsRes.data.data || reviewsRes.data;
      setReviewSummary(reviewData.summary || { reviewCount: 0, averageRating: 0 });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useFocusEffect(
    useCallback(() => {
      fetchPackageDetails();
    }, [fetchPackageDetails])
  );

  const handleDeleteImage = async (imageId, filename) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteImage(imageId);
              if (coverImage?._id === imageId) {
                setCoverImage(null);
              } else {
                setGalleryImages(prev => prev.filter(img => img._id !== imageId));
              }
              Alert.alert('Success', 'Image deleted successfully');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  if (loading) return <Loader />;

  if (!pkg) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>Package not found.</Text>
      </View>
    );
  }

  const imageSources = galleryImages.length
    ? galleryImages.map((image) => ({ uri: resolveUploadUrl(image.url) }))
    : pkg.image
      ? [{ uri: resolveUploadUrl(pkg.image) }]
      : [];

  const avgRating = Number(reviewSummary.averageRating || 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Cover Image ── */}
        {(coverImage || pkg.image) && (
          <View style={styles.coverImageSection}>
            <Image
              source={{
                uri: coverImage
                  ? resolveUploadUrl(coverImage.url)
                  : resolveUploadUrl(pkg.image),
              }}
              style={styles.coverImage}
              resizeMode="cover"
            />

            {/* Gradient overlay strip */}
            <View style={styles.coverOverlay} />

            {/* Price badge — bottom left on image */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>${pkg.price}</Text>
            </View>

            {/* Cover label — bottom right */}
            <View style={styles.coverBadge}>
              <Text style={styles.coverBadgeText}>Cover Image</Text>
            </View>

            {/* Delete button — top right */}
            {coverImage && (
              <TouchableOpacity
                style={styles.coverDeleteButton}
                onPress={() => handleDeleteImage(coverImage._id, coverImage.filename)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Title & Description ── */}
        <Text style={styles.title}>{pkg.title}</Text>
        <Text style={styles.description}>{pkg.description}</Text>

        {/* ── Ratings Card ── */}
        <View style={styles.reviewCard}>
          <Text style={styles.sectionTitle}>Ratings & Reviews</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>{avgRating.toFixed(1)}</Text>

            <View style={styles.starsAndCount}>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Ionicons
                    key={index}
                    name={index < Math.round(avgRating) ? 'star' : 'star-outline'}
                    size={16}
                    color={index < Math.round(avgRating) ? '#F4A91B' : colors.border}
                  />
                ))}
              </View>
              <Text style={styles.reviewCount}>{reviewSummary.reviewCount || 0} reviews</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => navigation.navigate('Reviews', { packageId: pkg._id, packageTitle: pkg.title })}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={15} color="#fff" />
            <Text style={styles.reviewButtonText}>View / Add Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* ── Gallery ── */}
        {galleryImages.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
              {galleryImages.map((image) => (
                <View key={image._id} style={styles.imageContainer}>
                  <Image
                    source={{ uri: resolveUploadUrl(image.url) }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteImage(image._id, image.filename)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom breathing room so content clears the fixed button */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Fixed Book Now ── */}
      <View style={styles.bookBar}>
        <View style={styles.bookBarLeft}>
          <Text style={styles.bookBarLabel}>Total price</Text>
          <Text style={styles.bookBarPrice}>${pkg.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('CreateBooking', { package: pkg })}
          activeOpacity={0.85}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 16 },

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverImageSection: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  coverImage: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceHigh,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    backgroundColor: colors.primary,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  coverBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  coverDeleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.danger,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 22,
  },

  // ── Review card ───────────────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  ratingValue: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  starsAndCount: { gap: 6 },
  starsRow: { flexDirection: 'row', gap: 3 },
  reviewCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Gallery ───────────────────────────────────────────────────────────────
  gallerySection: { marginBottom: 8 },
  galleryScroll: { marginBottom: 4 },
  imageContainer: {
    position: 'relative',
    marginRight: 14,
  },
  galleryImage: {
    width: screenWidth * 0.78,
    height: 215,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.danger,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Book bar ──────────────────────────────────────────────────────────────
  bookBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bookBarLeft: { gap: 2 },
  bookBarLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bookBarPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 16,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
});