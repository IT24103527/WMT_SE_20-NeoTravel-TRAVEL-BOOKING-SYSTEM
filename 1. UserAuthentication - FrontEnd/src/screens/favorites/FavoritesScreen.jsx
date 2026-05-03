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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Loader from '../../components/common/Loader';
import { getMyFavorites, updateFavorite, removeFavorite } from '../../api/favorite.api';
import { colors, shadowSm } from '../../utils/theme';

// Priority config for display
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
  const [removing,  setRemoving]    = useState(null);  // packageId being removed
  const [saving,    setSaving]      = useState(false);  // edit modal saving

  // ── Edit Modal state ────────────────────────────────────────────
  const [editTarget, setEditTarget]     = useState(null);   // full favorite item
  const [draftNotes,    setDraftNotes]    = useState('');
  const [draftPriority, setDraftPriority] = useState('medium');

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

  // ── Open edit modal ──────────────────────────────────────────────
  const openEdit = (item) => {
    setEditTarget(item);
    setDraftNotes(item.notes    || '');
    setDraftPriority(item.priority || 'medium');
  };

  const closeEdit = () => {
    setEditTarget(null);
    setDraftNotes('');
    setDraftPriority('medium');
  };

  // ── Save update ──────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateFavorite(editTarget._id, {
        notes:    draftNotes.trim(),
        priority: draftPriority,
      });
      // Optimistically update the list
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

  // ── Remove ───────────────────────────────────────────────────────
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

  // ── Render card ──────────────────────────────────────────────────
  const renderCard = ({ item }) => {
    const p = priorityConfig(item.priority);

    return (
      <View style={styles.card}>
        {/* Image */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={36} color={colors.border} />
          </View>
        )}

        {/* Priority badge */}
        <View style={[styles.priorityBadge, { backgroundColor: p.color }]}>
          <Ionicons name={p.icon} size={12} color="#fff" />
          <Text style={styles.priorityBadgeText}>{p.label}</Text>
        </View>

        {/* Heart (remove) button */}
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

        {/* Card body */}
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

          {item.destination ? (
            <View style={styles.destinationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.destination}>{item.destination}</Text>
            </View>
          ) : null}

          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

          {/* Notes display */}
          {item.notes ? (
            <View style={styles.notesRow}>
              <Ionicons name="create-outline" size={13} color={colors.textMuted} />
              <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.price}>${item.price}</Text>
            {item.duration ? (
              <Text style={styles.duration}>{item.duration} days</Text>
            ) : null}
          </View>

          {/* Action buttons row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => openEdit(item)}
            >
              <Ionicons name="pencil-outline" size={15} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.detailsBtn]}
              onPress={() => navigation.navigate('PackageDetails', { packageId: item._id })}
            >
              <Ionicons name="eye-outline" size={15} color={colors.white} />
              <Text style={styles.detailsBtnText}>View Details</Text>
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
          renderItem={renderCard}
        />
      )}

      {/* ── Edit Modal ──────────────────────────────────────────── */}
      <Modal
        visible={!!editTarget}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Edit Favorite</Text>
            {editTarget ? (
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {editTarget.title}
              </Text>
            ) : null}

            {/* Priority selector */}
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityChip,
                    draftPriority === p.value && { backgroundColor: p.color, borderColor: p.color },
                  ]}
                  onPress={() => setDraftPriority(p.value)}
                >
                  <Ionicons
                    name={p.icon}
                    size={16}
                    color={draftPriority === p.value ? '#fff' : p.color}
                  />
                  <Text
                    style={[
                      styles.priorityChipText,
                      draftPriority === p.value && { color: '#fff' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes input */}
            <Text style={styles.fieldLabel}>Personal Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={draftNotes}
              onChangeText={setDraftNotes}
              placeholder="e.g. Visit in December, book 3 months early…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{draftNotes.length}/300</Text>

            {/* Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  // ── Empty state ────────────────────────────────────────────────
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

  // ── List ──────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // ── Card ──────────────────────────────────────────────────────
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

  // ── Priority badge (top-left overlay) ────────────────────────
  priorityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Heart remove button (top-right overlay) ───────────────────
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

  // ── Card body ─────────────────────────────────────────────────
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
    marginBottom: 10,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    fontStyle: 'italic',
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

  // ── Action buttons ────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editBtn: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  detailsBtn: {
    backgroundColor: colors.primary,
  },
  detailsBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Edit Modal ────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    ...shadowSm,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Priority chips
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // Notes
  notesInput: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: 20,
  },

  // Modal action buttons
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
