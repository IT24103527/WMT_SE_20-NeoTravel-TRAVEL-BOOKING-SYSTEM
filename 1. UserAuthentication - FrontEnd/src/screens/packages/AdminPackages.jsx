// src/screens/packages/AdminPackages.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Image, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import AnimatedModal from '../../components/common/AnimatedModal';
import { 
  getAllPackages, 
  createPackage, 
  updatePackage, 
  deletePackage 
} from '../../api/package.api';
import { uploadImage } from '../../api/image.api';
import { colors, shadowSm } from '../../utils/theme';

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    image: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data } = await getAllPackages();
      setPackages(data.data || data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        title: pkg.title || '',
        description: pkg.description || '',
        price: pkg.price?.toString() || '',
        image: pkg.image || ''
      });
    } else {
      setEditingPackage(null);
      setFormData({ title: '', description: '', price: '', image: '' });
    }
    setSelectedImage(null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Media library access is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      const selected = result.assets?.[0] || result;
      if (!result.cancelled) {
        setSelectedImage(selected);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to select image. Please try again.');
    }
  };

  const prepareImageFormData = (image, packageId) => {
    const uri = image.uri || image;
    const filename = image.fileName || uri.split('/').pop();
    const fileExt = filename.split('.').pop().toLowerCase();
    const fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    const formData = new FormData();
    formData.append('packageId', packageId);
    formData.append('image', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: filename,
      type: fileType,
    });
    return formData;
  };

  const uploadPackageImage = async (packageId) => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      const formData = prepareImageFormData(selectedImage, packageId);
      const { data } = await uploadImage(formData);
      return data?.image;
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Image upload failed');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price) {
      Alert.alert('Error', 'Title and Price are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      };
      let savedPackage = null;

      if (editingPackage) {
        const { data } = await updatePackage(editingPackage._id, payload);
        savedPackage = data.data || data;
        Alert.alert('Success', 'Package updated successfully');
      } else {
        const { data } = await createPackage(payload);
        savedPackage = data.data || data;
        Alert.alert('Success', 'Package created successfully');
      }

      if (selectedImage && savedPackage?._id) {
        await uploadPackageImage(savedPackage._id);
      }

      setModalVisible(false);
      fetchPackages(); // refresh list
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (pkg) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to delete "${pkg.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePackage(pkg._id);
              Alert.alert('Deleted', 'Package has been deleted');
              fetchPackages();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete package');
            }
          }
        }
      ]
    );
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Packages</Text>
        <Button 
          title=" + Add New Package" 
          onPress={() => openModal()} 
          variant="primary"
          style={styles.addBtn}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {packages.length === 0 ? (
          <Text style={styles.empty}>No packages found. Add some!</Text>
        ) : (
          packages.map((pkg) => (
            <View key={pkg._id} style={styles.card}>
              {pkg.image && (
                <Image source={{ uri: pkg.image }} style={styles.image} />
              )}
              <View style={styles.cardContent}>
                <Text style={styles.packageTitle}>{pkg.title}</Text>
                <Text style={styles.price}>${pkg.price}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {pkg.description}
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.editBtn}
                    onPress={() => openModal(pkg)}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(pkg)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <AnimatedModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingPackage ? "Edit Package" : "Add New Package"}
      >
        <TextInput
          style={styles.input}
          placeholder="Package Title"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Price (USD)"
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Image URL (optional)"
          value={formData.image}
          onChangeText={(text) => setFormData({ ...formData, image: text })}
        />

        <Button
          title={selectedImage ? 'Change Image' : 'Select Image'}
          onPress={pickImage}
          variant="secondary"
          style={styles.uploadBtn}
          loading={uploadingImage}
        />

        {selectedImage?.uri && (
          <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
        )}

        <Button 
          title={saving ? "Saving..." : editingPackage ? "Update Package" : "Create Package"} 
          onPress={handleSave} 
          loading={saving}
          style={styles.saveBtn}
        />
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8 },

  scrollContent: { padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadowSm,
  },
  image: {
    width: '100%',
    height: 160,
  },
  cardContent: { padding: 16 },
  packageTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  price: { fontSize: 20, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  editBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  deleteBtn: {
    backgroundColor: colors.danger + '20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editText: { color: 'white', fontWeight: '600' },
  deleteText: { color: colors.danger, fontWeight: '600' },

  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: colors.surfaceHigh,
  },
  uploadBtn: { marginBottom: 14 },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: colors.surfaceHigh,
  },
  saveBtn: { marginTop: 10 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 100,
  },
});