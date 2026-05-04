import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { processPayment } from '../../api/booking.api';
import Loader from '../../components/common/Loader';
import { colors } from '../../utils/theme';

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId, amount } = route.params || {};

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-format card: 0000 0000 0000 0000
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Auto-format expiry: MM/YY
  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handlePayment = async () => {
    const rawCard = cardNumber.replace(/\s/g, '');
    
    // --- 1. STRICT CLIENT-SIDE VALIDATIONS ---
    if (rawCard.length !== 16) {
      return Alert.alert('Validation Error', 'Card number must be exactly 16 digits.');
    }

    if (expiry.length !== 5) {
      return Alert.alert('Validation Error', 'Expiry must be in MM/YY format.');
    }

    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return Alert.alert('Validation Error', 'Invalid month. Must be between 01 and 12.');
    }
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return Alert.alert('Validation Error', 'This card has expired.');
    }

    if (cvv.trim().length !== 3) {
      return Alert.alert('Validation Error', 'CVV must be exactly 3 digits.');
    }

    // --- 2. API SUBMISSION ---
    try {
      setLoading(true);
      await processPayment(bookingId, { cardNumber: rawCard, expiry, cvv });
      Alert.alert('Success', 'Payment processed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Could not process payment.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Pay Total: ${amount}</Text>

        <Text style={styles.label}>Card Number</Text>
        <TextInput
          style={styles.input}
          placeholder="0000 0000 0000 0000"
          keyboardType="numeric"
          maxLength={19}
          value={cardNumber}
          onChangeText={formatCardNumber}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Expiry (MM/YY)</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              keyboardType="numeric"
              maxLength={5}
              value={expiry}
              onChangeText={formatExpiry}
            />
          </View>

          <View style={styles.half}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={styles.input}
              placeholder="123"
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
              value={cvv}
              onChangeText={setCvv}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20, textAlign: 'center', color: colors.primary },
  label: { fontSize: 13, color: '#555', marginBottom: 5, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  payButton: { backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  payText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
