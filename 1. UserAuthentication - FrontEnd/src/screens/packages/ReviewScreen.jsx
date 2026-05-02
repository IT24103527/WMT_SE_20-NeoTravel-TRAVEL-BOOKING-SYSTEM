import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { createReview, deleteReview, getPackageReviews, updateReview } from '../../api/review.api';
import { colors, shadowSm } from '../../utils/theme';

const toStars = (rating) => Array.from({ length: 5 }, (_, index) => index < rating);

export default function ReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const packageId = route.params?.packageId;
  const packageTitle = route.params?.packageTitle || 'Package Reviews';

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ reviewCount: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: packageTitle });
  }, [navigation, packageTitle]);

  useEffect(() => {
    if (!packageId) return;
    fetchReviews();
  }, [packageId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await getPackageReviews(packageId);
      const payload = data.data || data;
      setReviews(payload.reviews || []);
      setSummary(payload.summary || { reviewCount: 0, averageRating: 0 });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Validation', 'Please select a rating from 1 to 5');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Validation', 'Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateReview(editingId, { rating, comment });
      } else {
        await createReview({ packageId, rating, comment });
      }
      setComment('');
      setRating(0);
      setEditingId(null);
      await fetchReviews();
      Alert.alert('Success', editingId ? 'Review updated successfully' : 'Review added successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingId(review._id);
    setRating(review.rating);
    setComment(review.comment);
    Alert.alert('Edit Review', 'Update the rating or comment, then save changes.');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setRating(0);
    setComment('');
  };

  const handleDelete = (reviewId) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(reviewId);
            await deleteReview(reviewId);
            await fetchReviews();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete review');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const averageRating = useMemo(() => Number(summary.averageRating || 0), [summary.averageRating]);

  if (loading) return <Loader />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryCard}>
        <Text style={styles.title}>{packageTitle}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsRow}>
            {toStars(Math.round(averageRating)).map((filled, index) => (
              <Text key={index} style={[styles.star, filled && styles.starActive]}>★</Text>
            ))}
          </View>
        </View>
        <Text style={styles.summaryText}>{summary.reviewCount || 0} total reviews</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId ? 'Edit Your Review' : 'Add Your Review'}</Text>

        <Text style={styles.label}>Rating</Text>
        <View style={styles.ratingPicker}>
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            const selected = value <= rating;
            return (
              <TouchableOpacity key={value} onPress={() => setRating(value)} style={styles.starButton}>
                <Text style={[styles.pickStar, selected && styles.pickStarActive]}>★</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.ratingHint}>
          {rating ? `Selected rating: ${rating}/5` : 'Tap a star to select your rating'}
        </Text>

        <Text style={styles.label}>Comment</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Write your experience here"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={5}
          style={styles.textArea}
        />

        <Button title={editingId ? 'Save Changes' : 'Submit Review'} onPress={handleSubmit} loading={submitting} />
        {editingId && (
          <Button
            title="Cancel Edit"
            onPress={handleCancelEdit}
            variant="ghost"
            style={{ marginTop: 10 }}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>All Reviews</Text>
      {reviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No reviews yet. Be the first to add one.</Text>
        </View>
      ) : (
        reviews.map((review) => (
          <View key={review._id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.reviewUser}>{review.userId?.username || 'Guest user'}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.inlineStars}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Text
                    key={index}
                    style={[styles.reviewStar, index < review.rating && styles.reviewStarActive]}
                  >
                    ★
                  </Text>
                ))}
              </View>
            </View>

            <Text style={styles.reviewComment}>{review.comment}</Text>

            {(review.canEdit || review.canDelete) && (
              <View style={styles.actionRow}>
                {review.canEdit && (
                  <Button
                    title={editingId === review._id ? 'Editing...' : 'Edit Review'}
                    variant="secondary"
                    onPress={() => handleEdit(review)}
                    style={styles.actionBtn}
                  />
                )}
                {review.canDelete && (
                  <Button
                    title={deletingId === review._id ? 'Deleting...' : 'Delete Review'}
                    variant="danger"
                    loading={deletingId === review._id}
                    onPress={() => handleDelete(review._id)}
                    style={styles.actionBtn}
                  />
                )}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSm,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  ratingValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  starsRow: { flexDirection: 'row', gap: 3 },
  star: { fontSize: 18, color: colors.border },
  starActive: { color: colors.warning },
  summaryText: { color: colors.textSecondary, fontWeight: '600' },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSm,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.1 },
  ratingPicker: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  starButton: { paddingVertical: 4, paddingHorizontal: 2 },
  pickStar: { fontSize: 26, color: colors.border },
  pickStarActive: { color: colors.warning },
  ratingHint: { marginBottom: 16, color: colors.textMuted, fontSize: 12 },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceHigh,
    marginBottom: 16,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: { color: colors.textMuted, textAlign: 'center' },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSm,
    marginBottom: 14,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  reviewUser: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  reviewDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  inlineStars: { flexDirection: 'row', gap: 2 },
  reviewStar: { fontSize: 15, color: colors.border },
  reviewStarActive: { color: colors.warning },
  reviewComment: { color: colors.textSecondary, lineHeight: 22, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 140, marginTop: 4 },
});