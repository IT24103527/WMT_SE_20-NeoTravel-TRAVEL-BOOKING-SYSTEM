import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createBooking } from '../../api/booking.api';
import Loader from '../../components/common/Loader';
import { colors } from '../../utils/theme';
import { resolveUploadUrl } from '../../api/image.api';

export default function CreateBookingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { package: pkg } = route.params || {};

  const [travelers, setTravelers] = useState('1');
  const [bookingDate, setBookingDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  if (!pkg) return <Text>Package data missing.</Text>;

  const handleTravelerChange = (val) => {
    const numeric = val.replace(/[^0-9]/g, '');
    if (numeric !== '' && parseInt(numeric) < 1) {
      setTravelers('1');
    } else {
      setTravelers(numeric);
    }
  };

  const totalPrice = pkg.price * (parseInt(travelers) || 1);

  const handleConfirm = async () => {
    if (!bookingDate) {
      return Alert.alert('Error', 'Please enter a booking date.');
    }
    const travelerCount = parseInt(travelers);
    if (isNaN(travelerCount) || travelerCount < 1) {
      return Alert.alert('Error', 'Please enter a valid number of travelers.');
    }

    try {
      setLoading(true);
      await createBooking({
        packageId: pkg._id,
        travelers: travelerCount,
        bookingDate,
        specialRequests
      });
      
      Alert.alert('Success', 'Booking confirmed!', [
        { text: 'OK', onPress: () => navigation.navigate('Bookings') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create booking.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView>
        <Image 
          source={{ uri: resolveUploadUrl(pkg.image) }} 
          style={styles.headerImage} 
        />
        <View style={styles.content}>
          <Text style={styles.title}>{pkg.title}</Text>
          <Text style={styles.pricePerPerson}>${pkg.price} per person</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Number of Travelers</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={travelers}
              onChangeText={handleTravelerChange}
            />

            <Text style={styles.label}>Booking Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-12-25"
              value={bookingDate}
              onChangeText={setBookingDate}
            />

            <Text style={styles.label}>Special Requests (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Dietary requirements, window seat, etc."
              multiline
              numberOfLines={4}
              value={specialRequests}
              onChangeText={setSpecialRequests}
            />
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Price:</Text>
            <Text style={styles.totalPrice}>${totalPrice}</Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerImage: { width: '100%', height: 200, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 5 },
  pricePerPerson: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 20 },
  formCard: {
    backgroundColor: '#eff3f8',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20
  },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20
  },
  totalLabel: { fontSize: 18, fontWeight: '600', color: '#374151' },
  totalPrice: { fontSize: 26, fontWeight: '800', color: '#1e3a8a' }, // Darker blue for contrast
  confirmButton: { backgroundColor: '#1e3a8a', padding: 18, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
