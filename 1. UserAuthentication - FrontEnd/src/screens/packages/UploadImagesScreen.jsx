import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/common/Button';
import { uploadImage, resolveUploadUrl } from '../../api/image.api';
import { colors, shadowSm } from '../../utils/theme';

export default function UploadImagesScreen({ route, navigation }) {
  const packageId = route.params?.packageId;

  const [selectedImages, setSelectedImages] = useState([]);
  const [coverImageIndex, setCoverImageIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!packageId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Package ID not found.</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const pickMultipleImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Media library access is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultiple: true,
        quality: 0.8,
      });

      if (!result.cancelled) {
        const newImages = result.assets || [result];
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to select images. Please try again.');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (coverImageIndex === index) {
      setCoverImageIndex(null);
    } else if (coverImageIndex > index) {
      setCoverImageIndex(prev => prev - 1);
    }
  };

  const prepareImageFormData = (image, isCover = false) => {
    const uri = image.uri || image;
    const filename = image.fileName || uri.split('/').pop();
    const fileExt = filename.split('.').pop().toLowerCase();
    const fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    const formData = new FormData();
    formData.append('packageId', packageId);
    formData.append('isCover', isCover);
    formData.append('image', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: filename,
      type: fileType,
    });
    return formData;
  };

  const uploadAllImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image to upload.');
      return;
    }

    setUploading(true);
    try {
      let successCount = 0;
      const totalImages = selectedImages.length;

      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const isCover = i === coverImageIndex;

        try {
          const formData = prepareImageFormData(image, isCover);
          await uploadImage(formData);
          successCount++;
          setUploadProgress(((i + 1) / totalImages) * 100);
        } catch (err) {
          console.error(`Failed to upload image ${i + 1}:`, err);
          Alert.alert('Upload Error', `Failed to upload image ${i + 1}`);
        }
      }

      if (successCount > 0) {
        Alert.alert(
          'Success',
          `${successCount} of ${totalImages} image(s) uploaded successfully`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Failed to upload images. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageItem}>
      <View
        style={[
          styles.imageWrapper,
          coverImageIndex === index && styles.coverImageWrapper,
        ]}
      >
        <Image
          source={{ uri: item.uri || item }}
          style={styles.image}
          resizeMode="cover"
        />
        {coverImageIndex === index && (
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>COVER</Text>
          </View>
        )}
      </View>

      <View style={styles.imageControls}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            coverImageIndex === index && styles.activeCoverButton,
          ]}
          onPress={() =>
            setCoverImageIndex(coverImageIndex === index ? null : index)
          }
        >
          <Text
            style={[
              styles.actionButtonText,
              coverImageIndex === index && styles.activeCoverButtonText,
            ]}
          >
            {coverImageIndex === index ? '★ Cover' : '☆ Set Cover'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeImage(index)}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Upload Package Images</Text>
          <Text style={styles.instructionText}>
            Select multiple images for your package. Mark one image as the cover
            image.
          </Text>
        </View>

        {selectedImages.length > 0 && (
          <View style={styles.selectedCountCard}>
            <Text style={styles.selectedCountText}>
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </Text>
            {coverImageIndex !== null && (
              <Text style={styles.coverCountText}>
                Cover image: Image {coverImageIndex + 1}
              </Text>
            )}
          </View>
        )}

        {selectedImages.length > 0 && (
          <FlatList
            data={selectedImages}
            renderItem={renderImageItem}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.galleryContainer}
          />
        )}

        {selectedImages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No images selected yet</Text>
          </View>
        )}

        {uploading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.progressText}>
              Uploading... {Math.round(uploadProgress)}%
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.secondaryButton, uploading && styles.disabledButton]}
          onPress={pickMultipleImages}
          disabled={uploading}
        >
          <Text style={styles.secondaryButtonText}>+ Add More Images</Text>
        </TouchableOpacity>

        <Button
          title={uploading ? 'Uploading...' : 'Upload Images'}
          onPress={uploadAllImages}
          disabled={uploading || selectedImages.length === 0}
          style={{ flex: 1, marginLeft: 12 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  instructionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadowSm,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  selectedCountCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  coverCountText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  galleryContainer: {
    marginBottom: 16,
  },
  imageItem: {
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadowSm,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImageWrapper: {
    borderWidth: 3,
    borderColor: colors.warning,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coverBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  imageControls: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  activeCoverButton: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeCoverButtonText: {
    color: colors.warning,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: 20,
    textAlign: 'center',
  },
});
