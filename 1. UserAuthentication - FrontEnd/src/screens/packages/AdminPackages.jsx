// src/screens/packages/AdminPackages.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
  TextInput, Image, Platform, SafeAreaView, StatusBar, Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Loader from '../../components/common/Loader';
import AnimatedModal from '../../components/common/AnimatedModal';
import { getAllPackages, createPackage, updatePackage, deletePackage } from '../../api/package.api';
import { uploadImage, getImagesByPackage, deleteImage, resolveUploadUrl } from '../../api/image.api';
import { colors } from '../../utils/theme';

// ── Tag pill (same as Packages.jsx) ──────────────────────────────────────────
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

// ── Photo badge (optional) ───────────────────────────────────────────────────
function InfoBadge({ count }) {
  if (!count) return null;
  return (
    <View style={styles.photoBadge}>
      <Ionicons name="images-outline" size={10} color="#fff" />
      <Text style={styles.photoBadgeText}>{count} photo{count !== 1 ? 's' : ''}</Text>
    </View>
  );
}

// ── Image row inside modal (unchanged functionality) ─────────────────────────
function ImageRow({ newImages, existingImages, coverImageId, onPickMore, onRemoveNew, onDeleteExisting, uploading }) {
  return (
    <View>
      <View style={styles.imgSectionHeader}>
        <Text style={styles.fieldLabel}>Package Images</Text>
        <TouchableOpacity style={styles.addMoreBtn} onPress={onPickMore} disabled={uploading}>
          <Ionicons name="add" size={14} color={colors.primary} />
          <Text style={styles.addMoreText}>Add Photos</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
        {existingImages.map((img) => (
          <View key={img._id} style={styles.thumbWrap}>
            <Image source={{ uri: resolveUploadUrl(img.url) }} style={styles.thumb} resizeMode="cover" />
            {img._id === coverImageId && (
              <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View>
            )}
            <TouchableOpacity style={styles.thumbDel} onPress={() => onDeleteExisting(img._id)}>
              <Ionicons name="close" size={10} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {newImages.map((img, i) => (
          <View key={`new-${i}`} style={[styles.thumbWrap, styles.thumbNew]}>
            <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
            {i === 0 && existingImages.length === 0 && (
              <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View>
            )}
            <TouchableOpacity style={styles.thumbDel} onPress={() => onRemoveNew(i)}>
              <Ionicons name="close" size={10} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.thumbAdd} onPress={onPickMore} disabled={uploading} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={22} color="#ccc" />
          <Text style={styles.thumbAddText}>Add</Text>
        </TouchableOpacity>
      </ScrollView>
      <Text style={styles.imgHint}>First image becomes the cover · Tap × to remove</Text>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function AdminPackages() {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', price: '', categories: ['Popular'] });
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [coverImageId, setCoverImageId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const CATEGORIES = ["Popular", "Beach", "Adventure", "Cultural", "Luxury"];

  useEffect(() => { fetchPackages(); }, []);

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
            return { ...pkg, image: cover ? resolveUploadUrl(cover.url) : null };
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

  const fetchExistingImages = async (packageId) => {
    try {
      const { data } = await getImagesByPackage(packageId);
      if (data.coverImage !== undefined) {
        const cover = data.coverImage ? [data.coverImage] : [];
        const gallery = data.galleryImages || [];
        setExistingImages([...cover, ...gallery]);
        setCoverImageId(data.coverImage?._id ?? null);
      } else {
        setExistingImages(data.images || []);
        setCoverImageId(null);
      }
    } catch {
      setExistingImages([]);
    }
  };

  const openModal = async (pkg = null) => {
    setNewImages([]);
    setExistingImages([]);
    setCoverImageId(null);

    if (pkg) {
      setEditingPackage(pkg);
      let categories = pkg.categories;
      if (!categories || categories.length === 0) {
        categories = pkg.category ? [pkg.category] : ['Popular'];
      }
      setFormData({
        title: pkg.title || '',
        description: pkg.description || '',
        price: pkg.price?.toString() || '',
        categories: categories,
      });
      await fetchExistingImages(pkg._id);
    } else {
      setEditingPackage(null);
      setFormData({ title: '', description: '', price: '', categories: ['Popular'] });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewImages([]);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Media library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      setNewImages((prev) => [...prev, ...result.assets]);
    }
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = (imageId) => {
    Alert.alert('Delete Image', 'Remove this image from the package?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteImage(imageId);
            if (coverImageId === imageId) setCoverImageId(null);
            setExistingImages((prev) => prev.filter((img) => img._id !== imageId));
          } catch {
            Alert.alert('Error', 'Could not delete image');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.price) {
      Alert.alert('Required fields', 'Title and Price are required');
      return;
    }
    if (!formData.categories || formData.categories.length === 0) {
      Alert.alert('Required', 'Please select at least one category');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        categories: formData.categories,
      };
      let savedPackage;

      if (editingPackage) {
        const { data } = await updatePackage(editingPackage._id, payload);
        savedPackage = data.data || data;
      } else {
        const { data } = await createPackage(payload);
        savedPackage = data.data || data;
      }

      if (newImages.length > 0 && savedPackage?._id) {
        setUploadingImage(true);
        for (const img of newImages) {
          const fd = prepareImageFormData(img, savedPackage._id);
          await uploadImage(fd);
        }
      }

      Alert.alert('Success', editingPackage ? 'Package updated!' : 'Package created!');
      closeModal();
      fetchPackages();

      if (!editingPackage && savedPackage?._id) {
        navigation.navigate('PackageDetails', { packageId: savedPackage._id });
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save package');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const prepareImageFormData = (image, packageId) => {
    const uri = image.uri;
    const filename = image.fileName || uri.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const fd = new FormData();
    fd.append('packageId', packageId);
    fd.append('image', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: filename,
      type,
    });
    return fd;
  };

  const handleDelete = (pkg) => {
    Alert.alert('Delete Package', `Delete "${pkg.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deletePackage(pkg._id);
            fetchPackages();
          } catch {
            Alert.alert('Error', 'Could not delete package');
          }
        },
      },
    ]);
  };

  const getPackageCategories = (pkg) => {
    if (pkg.categories && Array.isArray(pkg.categories) && pkg.categories.length > 0) {
      return pkg.categories;
    }
    if (pkg.category && typeof pkg.category === 'string') {
      return [pkg.category];
    }
    return ['Popular'];
  };

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Manage</Text>
          <Text style={styles.headerTitle}>Travel Packages</Text>
          <Text style={styles.headerCount}>{packages.length} package{packages.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Package list - modern card style */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {packages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No packages yet.</Text>
            <Text style={styles.emptyHint}>Tap "Add" to create your first package.</Text>
          </View>
        ) : (
          packages.map((pkg) => {
            const categories = getPackageCategories(pkg);
            return (
              <View key={pkg._id} style={styles.card}>
                {/* Cover image */}
                {pkg.image ? (
                  <View style={styles.coverWrap}>
                    <Image source={{ uri: pkg.image }} style={styles.coverImage} resizeMode="cover" />
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>${pkg.price}</Text>
                    </View>
                    <InfoBadge count={pkg.imageCount} />
                  </View>
                ) : (
                  <View style={[styles.coverImage, styles.placeholderCover]}>
                    <Ionicons name="image-outline" size={32} color="#ccc" />
                  </View>
                )}

                {/* Card body */}
                <View style={styles.cardBody}>
                  <Text style={styles.pkgName} numberOfLines={1}>{pkg.title}</Text>
                  
                  <View style={styles.tags}>
                    {categories.map((cat) => (
                      <Tag key={cat} label={cat} type={cat.toLowerCase()} />
                    ))}
                  </View>

                  <Text style={styles.desc} numberOfLines={2}>{pkg.description}</Text>

                  <View style={styles.divider} />

                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.btnEdit} onPress={() => openModal(pkg)} activeOpacity={0.8}>
                      <Ionicons name="pencil-outline" size={14} color="#fff" />
                      <Text style={styles.btnEditText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(pkg)} activeOpacity={0.8}>
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                      <Text style={styles.btnDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* add /edit Modal with keyboard dismiss area */}
      <AnimatedModal
        visible={modalVisible}
        onClose={closeModal}
        title={editingPackage ? 'Edit Package' : 'Add New Package'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Package Title <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Maldives Water Villas"
                placeholderTextColor="#bbb"
                value={formData.title}
                onChangeText={(t) => setFormData({ ...formData, title: t })}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Describe the highlights of this package..."
                placeholderTextColor="#bbb"
                multiline
                value={formData.description}
                onChangeText={(t) => setFormData({ ...formData, description: t })}
              />
            </View>

            {/* Price */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Price (USD) <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#bbb"
                value={formData.price}
                onChangeText={(t) => setFormData({ ...formData, price: t })}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Categories multi-select */}
            <Text style={styles.fieldLabel}>Categories (select multiple)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = formData.categories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      let newCats;
                      if (isSelected) {
                        newCats = formData.categories.filter(c => c !== cat);
                        if (newCats.length === 0) newCats = ['Popular'];
                      } else {
                        newCats = [...formData.categories, cat];
                      }
                      setFormData({ ...formData, categories: newCats });
                    }}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Images */}
            <View style={styles.field}>
              <ImageRow
                newImages={newImages}
                existingImages={existingImages}
                coverImageId={coverImageId}
                onPickMore={pickImages}
                onRemoveNew={removeNewImage}
                onDeleteExisting={handleDeleteExistingImage}
                uploading={uploadingImage}
              />
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, (saving || uploadingImage) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || uploadingImage}
              activeOpacity={0.85}
            >
              {saving || uploadingImage ? (
                <Text style={styles.saveBtnText}>
                  {uploadingImage ? 'Uploading images…' : 'Saving…'}
                </Text>
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </AnimatedModal>
    </SafeAreaView>
  );
}

// ── Styles (matching Packages.jsx + admin extras) ─────────────────────────────
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
  headerCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 20 },
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  // Card (identical to Packages.jsx)
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
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
  placeholderCover: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  photoBadge: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  cardBody: { padding: 18 },
  pkgName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  tagText: { fontSize: 11, fontWeight: '600' },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
  },
  btnEditText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  btnDelete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger + '30',
    borderRadius: 14,
    paddingVertical: 12,
  },
  btnDeleteText: { fontSize: 14, fontWeight: '700', color: colors.danger },

  // Modal fields (unchanged)
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 },
  req: { color: colors.primary, fontSize: 12 },
  input: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputMulti: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  imgSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addMoreText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  thumbScroll: { marginBottom: 8 },
  thumbWrap: { position: 'relative', marginRight: 10, borderRadius: 12, overflow: 'hidden' },
  thumbNew: { borderWidth: 2, borderColor: colors.primary + '50' },
  thumb: { width: 76, height: 66, borderRadius: 12 },
  coverBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  coverBadgeText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  thumbDel: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbAdd: {
    width: 76,
    height: 66,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    gap: 3,
    flexShrink: 0,
  },
  thumbAddText: { fontSize: 9, color: '#ccc', fontWeight: '500' },
  imgHint: { fontSize: 10, color: '#bbb', marginTop: 4 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F2F4F7',
  },
  categoryChipSelected: { backgroundColor: colors.primary },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  categoryChipTextSelected: { color: '#fff' },
});