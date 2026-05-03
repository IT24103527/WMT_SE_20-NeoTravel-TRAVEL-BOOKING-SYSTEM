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
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Loader from '../../components/common/Loader';
import { getPackageById } from '../../api/package.api';
import { getImagesByPackage, resolveUploadUrl, deleteImage } from '../../api/image.api';
import { getPackageReviews } from '../../api/review.api';
import { colors, shadowSm } from '../../utils/theme';

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

      // Handle both old and new API response formats
      const imagesData = imagesRes.data;
      if (imagesData.coverImage !== undefined) {
        // New API format with cover and gallery
        setCoverImage(imagesData.coverImage);
        setGalleryImages(imagesData.galleryImages || []);
      } else {
        // Fallback to old format
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
          }
        }
      ]
    );
  };

  if (loading) return <Loader />;

  if (!pkg) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Package not found.</Text>
      </View>
    );
  }

  const imageSources = galleryImages.length
    ? galleryImages.map((image) => ({ uri: resolveUploadUrl(image.url) }))
    : pkg.image
      ? [{ uri: resolveUploadUrl(pkg.image) }]
      : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cover Image */}
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
          {coverImage && (
            <TouchableOpacity
              style={styles.coverDeleteButton}
              onPress={() => handleDeleteImage(coverImage._id, coverImage.filename)}
            >
              <Text style={styles.deleteIcon}>×</Text>
            </TouchableOpacity>
          )}
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>Cover Image</Text>
          </View>
        </View>
      )}

      <Text style={styles.title}>{pkg.title}</Text>
      <Text style={styles.price}>${pkg.price}</Text>
      <Text style={styles.description}>{pkg.description}</Text>

      <View style={styles.reviewCard}>
        <Text style={styles.sectionTitle}>Ratings</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingValue}>{Number(reviewSummary.averageRating || 0).toFixed(1)}</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Text
                key={index}
                style={[
                  styles.star,
                  index < Math.round(reviewSummary.averageRating || 0) && styles.starActive,
                ]}
              >
                ★
              </Text>
            ))}
          </View>
          <Text style={styles.reviewCount}>{reviewSummary.reviewCount || 0} reviews</Text>
        </View>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('Reviews', { packageId: pkg._id, packageTitle: pkg.title })}
        >
          <Text style={styles.reviewButtonText}>View / Add Reviews</Text>
        </TouchableOpacity>
      </View>

      {/* Gallery Images */}
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
                >
                  <Text style={styles.deleteIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  coverImageSection: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadowSm,
  },
  coverImage: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surfaceHigh,
  },
  coverDeleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.danger,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowSm,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.primary + 'E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  coverBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  price: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  description: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 24 },
  reviewCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadowSm,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  ratingValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
  starsRow: { flexDirection: 'row', gap: 3 },
  star: { fontSize: 18, color: colors.border },
  starActive: { color: colors.warning },
  reviewCount: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  reviewButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewButtonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  gallerySection: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  galleryScroll: { marginBottom: 20 },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  galleryImage: {
    width: screenWidth * 0.8,
    height: 220,
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
    ...shadowSm,
  },
  deleteIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyGallery: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
});
