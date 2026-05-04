// src/screens/favorites/FavoritesScreen.jsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Loader from '../../components/common/Loader';
import { getMyFavorites, updateFavorite, removeFavorite } from '../../api/favorite.api';
import { getImagesByPackage, resolveUploadUrl } from '../../api/image.api';
import { colors, shadowSm } from '../../utils/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';


// ── Reuse Tag component from Packages ──────────────────────────────
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

// ── Helper: get categories array (identical to Packages) ───────────
function getPackageCategories(pkg) {
  if (pkg.categories && Array.isArray(pkg.categories) && pkg.categories.length > 0) {
    return pkg.categories;
  }
  if (pkg.category && typeof pkg.category === 'string') {
    return [pkg.category];
  }
  return ['Popular'];
}

// ── Priority config ────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#16A34A', icon: 'chevron-down-circle-outline' },
  { value: 'medium', label: 'Medium', color: '#D97706', icon: 'remove-circle-outline'       },
  { value: 'high',   label: 'High',   color: '#DC2626', icon: 'chevron-up-circle-outline'   },
];

const priorityConfig = (value) =>
  PRIORITIES.find((p) => p.value === value) || PRIORITIES[1];

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [removing,  setRemoving]    = useState(null);
  const [saving,    setSaving]      = useState(false);

  // Edit modal state
  const [editTarget, setEditTarget]     = useState(null);
  const [draftNotes,    setDraftNotes]    = useState('');
  const [draftPriority, setDraftPriority] = useState('medium');

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  // ── Fetch favorites WITH cover images (like Packages) ────────────
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data } = await getMyFavorites();
      let favList = data.data?.favorites || [];

      // Attach cover image URL for each favorite
      const enriched = await Promise.all(
        favList.map(async (fav) => {
          try {
            // The favorite may have a `package` object or just `packageId`
            const packageId = fav.package?._id || fav.packageId || fav._id;
            if (!packageId) return { ...fav, coverImage: null };

            const imgRes = await getImagesByPackage(packageId);
            const cover = imgRes.data.coverImage || imgRes.data.images?.[0];
            return {
              ...fav,
              coverImage: cover ? resolveUploadUrl(cover.url) : null,
              // Ensure the package data is merged if needed
              package: fav.package || { _id: packageId },
            };
          } catch {
            return { ...fav, coverImage: null };
          }
        })
      );

      setFavorites(enriched);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not load favorites');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setDraftNotes(item.notes || '');
    setDraftPriority(item.priority || 'medium');
  };

  const closeEdit = () => {
    setEditTarget(null);
    setDraftNotes('');
    setDraftPriority('medium');
  };

  const NOTES_MAX = 50;

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (draftNotes.length > NOTES_MAX) {
      Alert.alert('Note too long', `Personal notes must be ${NOTES_MAX} characters or fewer.`);
      return;
    }
    setSaving(true);
    try {
      await updateFavorite(editTarget._id, {
        notes: draftNotes.trim(),
        priority: draftPriority,
      });
      setFavorites((prev) =>
        prev.map((f) =>
          f._id === editTarget._id
            ? { ...f, notes: draftNotes.trim(), priority: draftPriority }
            : f
        )
      );
      closeEdit();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update favorite');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (item) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${item.title || item.package?.title}" from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(item._id);
            try {
              await removeFavorite(item._id);
              setFavorites((prev) => prev.filter((f) => f._id !== item._id));
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

  const renderCard = ({ item }) => {
    // Get package data (may be nested)
    const pkgData = item.package || item;
    const categories = getPackageCategories(pkgData);
    const title = item.title || pkgData.title || 'Untitled';
    const price = item.price || pkgData.price;
    const description = item.description || pkgData.description || '';
    const coverImage = item.coverImage;
    const p = priorityConfig(item.priority);

    return (
    <View style={styles.card}>
        {/* Cover image */}
        {coverImage ? (
          <View style={styles.coverWrap}>
            <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
            {price && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>${price}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => handleRemove(item)}
              disabled={removing === item._id}
            >
              <Ionicons
                name={removing === item._id ? 'heart-dislike' : 'heart'}
                size={20}
                color={removing === item._id ? colors.textMuted : colors.danger}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.coverImage, styles.placeholderCover]}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
            {price && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>${price}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.pkgName} numberOfLines={1}>{title}</Text>

          {/* Tags (categories) */}
          <View style={styles.tags}>
            {categories.map((cat) => (
              <Tag key={cat} label={cat} type={cat.toLowerCase()} />
            ))}
          </View>

          {/* Priority chip */}
          <View style={styles.priorityRow}>
            <View style={[styles.priorityChip, { backgroundColor: p.color + '20', borderColor: p.color }]}>
              <Ionicons name={p.icon} size={12} color={p.color} />
              <Text style={[styles.priorityChipText, { color: p.color }]}>{p.label} priority</Text>
            </View>
          </View>

          <Text style={styles.desc} numberOfLines={2}>{description}</Text>

          {item.notes ? (
            <View style={styles.notesRow}>
              <Ionicons name="create-outline" size={13} color={colors.textMuted} />
              <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btnEdit]} onPress={() => openEdit(item)}>
              <Ionicons name="pencil-outline" size={14} color="#fff" />
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnDetails]}
              onPress={() => navigation.navigate('PackageDetails', { packageId: pkgData._id })}
            >
              <Text style={styles.btnTextDetails}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
    </View>
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
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Packages')}>
            <Text style={styles.browseBtnText}>Browse Packages</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderCard}
        />
      )}

      {/* Edit Modal (unchanged but with keyboard dismiss) */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={closeEdit}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Edit Favorite</Text>
              {editTarget && (
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {editTarget.title || editTarget.package?.title}
                </Text>
              )}
              <Text style={styles.fieldLabel}>Priority</Text>
              <View style={styles.priorityRowModal}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityChipModal,
                      draftPriority === p.value && { backgroundColor: p.color, borderColor: p.color },
                    ]}
                    onPress={() => setDraftPriority(p.value)}
                  >
                    <Ionicons name={p.icon} size={16} color={draftPriority === p.value ? '#fff' : p.color} />
                    <Text style={[styles.priorityChipTextModal, draftPriority === p.value && { color: '#fff' }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Personal Notes</Text>
              <TextInput
                style={[styles.notesInput, draftNotes.length >= NOTES_MAX && styles.notesInputOver]}
                value={draftNotes}
                onChangeText={(text) => text.length <= NOTES_MAX && setDraftNotes(text)}
                placeholder="e.g. Visit in December…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={NOTES_MAX}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, draftNotes.length >= NOTES_MAX && styles.charCountOver]}>
                {draftNotes.length}/{NOTES_MAX}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSaveEdit} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles (matching Packages.jsx) ────────────────────────────────────────────
const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  header: 
  {
    fontSize: 24, 
    fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16,
  },
  listContent: 
  { paddingHorizontal: 16, paddingBottom: 24, gap: 20 },

  emptyContainer: 
  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },

  emptyTitle: 
  { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },

  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  browseBtn: { marginTop: 12, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },

  browseBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  glassOuter: {
  borderRadius: 28,
  padding: 2,

  // glowing border
  backgroundColor: 'rgba(255,255,255,0.15)',

  shadowColor: '#4FC3F7',
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 12,
},

card: {
  overflow: 'hidden',
  borderRadius: 26,

  backgroundColor: 'rgba(252, 253, 255, 0.92)',

  borderWidth: 1,
  borderColor: colors.textMuted,

  backdropFilter: 'blur(20px)', // ignore on RN if warning
},
  coverWrap: { position: 'relative' },

  coverImage: {
  width: '100%',
  height: 200,
  borderTopLeftRadius: 26,
  borderTopRightRadius: 26,
},

  placeholderCover: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },

  priceBadge: {
    position: 'absolute', bottom: 14, left: 16,
    backgroundColor: colors.primary, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6,
  },

  priceBadgeText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  heartBtn: {
    position: 'absolute', top: 12, right: 14, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12,
    shadowRadius: 4, elevation: 2,
  },

  cardBody: { padding: 18 },

  pkgName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },

  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },

  tagText: { fontSize: 11, fontWeight: '600' },

  priorityRow: { marginBottom: 10 },

  priorityChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },

  priorityChipText: { fontSize: 10, fontWeight: '600' },

  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },

  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: colors.surface, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight },

  notesText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17, fontStyle: 'italic' },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },

  btnRow: { flexDirection: 'row', gap: 10 },

  btnEdit: { flex: 1, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14 },

  btnDetails: { flex: 1, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12,borderWidth:1, borderColor:colors.textMuted,  borderRadius: 14, borderStyle:'solid' },

  btnText: { fontSize: 14, fontWeight: '600', color: '#faf9f9' },

  btnTextDetails: { color: colors.textPrimary, fontSize: 14, fontWeight: '600',justifyContent: 'center' },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },

  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, ...shadowSm },

  modalHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },

  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },

  modalSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  priorityRowModal: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  priorityChipModal: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },

  priorityChipTextModal: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },

  notesInput: { backgroundColor: colors.surfaceHigh, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 14, color: colors.textPrimary, minHeight: 100, marginBottom: 4 },

  notesInputOver: { borderColor: '#DC2626' },
  charCount: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginBottom: 20 },

  charCountOver: { color: '#DC2626', fontWeight: '700' },

  modalActions: { flexDirection: 'row', gap: 12 },

  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },

  cancelBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 15 },

  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.primary },

  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});