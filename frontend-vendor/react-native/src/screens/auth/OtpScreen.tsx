import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import api from '../../services/api';

export default function OtpScreen({ route, navigation }: any) {
  const { email } = route.params;
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Enter valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/verify-otp', { email, otpCode });

      Alert.alert('Success', 'OTP verified successfully', [
        {
          text: 'Login',
          onPress: () => navigation.replace('Login'), // or update context if using AuthProvider
        },
      ]);
    } catch (error: any) {
      console.log(error);
      const msg = error.response?.data?.message || 'Invalid or expired OTP';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setLoading(true);

      // Call resend OTP API
      await api.post(`/auth/resend-otp/${encodeURIComponent(email)}`);

      Alert.alert('Success', `OTP resent to ${email}`);
    } catch (error: any) {
      console.log(error);
      const msg = error.response?.data?.message || 'Failed to resend OTP';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>Vendor Delivery Partner</Text>
      <Text style={styles.title}>Verify OTP</Text>

      <Text style={styles.subtitle}>OTP sent to</Text>
      <Text style={styles.email}>{email}</Text>

      <TextInput
        placeholder="Enter OTP"
        keyboardType="number-pad"
        value={otpCode}
        onChangeText={setOtpCode}
        maxLength={6}
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, otpCode.length !== 6 && { opacity: 0.6 }]}
        disabled={otpCode.length !== 6 || loading}
        onPress={handleVerifyOtp}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendOtp}>
        <Text style={styles.resend}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  appTitle: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#16a34a' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  subtitle: { textAlign: 'center', marginTop: 10, color: 'gray' },
  email: { textAlign: 'center', fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, textAlign: 'center', fontSize: 18, letterSpacing: 8, marginBottom: 15 },
  button: { backgroundColor: '#16a34a', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  resend: { textAlign: 'center', marginTop: 20, color: '#16a34a', fontWeight: 'bold' },
});
