import React, { useEffect, useState } from 'react';
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
import { useRoute } from '@react-navigation/native';
import Loader from '../../components/common/Loader';
import { getPackageById } from '../../api/package.api';
import { getImagesByPackage, resolveUploadUrl, deleteImage } from '../../api/image.api';
import { colors, shadowSm } from '../../utils/theme';

const screenWidth = Dimensions.get('window').width;

export default function PackageDetails() {
  const route = useRoute();
  const packageId = route.params?.packageId;

  const [pkg, setPkg] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packageId) return;
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const packageRes = await getPackageById(packageId);
      const packageData = packageRes.data.data || packageRes.data;
      setPkg(packageData);

      const imagesRes = await getImagesByPackage(packageId);
      setImages(imagesRes.data.images || []);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

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
              setImages(prev => prev.filter(img => img._id !== imageId));
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

  const imageSources = images.length
    ? images.map((image) => ({ uri: resolveUploadUrl(image.url) }))
    : pkg.image
      ? [{ uri: resolveUploadUrl(pkg.image) }]
      : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{pkg.title}</Text>
      <Text style={styles.price}>${pkg.price}</Text>
      <Text style={styles.description}>{pkg.description}</Text>

      <View style={styles.gallerySection}>
        <Text style={styles.sectionTitle}>Package Images</Text>
        {images.length === 0 && !pkg.image ? (
          <View style={styles.emptyGallery}>
            <Text style={styles.emptyText}>No images uploaded for this package yet.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
            {images.length > 0 ? (
              images.map((image) => (
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
              ))
            ) : (
              pkg.image && (
                <Image
                  source={{ uri: resolveUploadUrl(pkg.image) }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              )
            )}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  price: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  description: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 24 },
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
