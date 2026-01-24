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

export default function ForgetPassScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/forgot-password', { email });
      // const data = response.data; // usually plain text or json

      // Since axios resolves promises on 2xx status code
      Alert.alert('Success','OTP sent successfully');
      navigation.navigate('ResetPassword', { email });

    } catch (error: any) {
      console.log(error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to send OTP';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>VendorHub</Text>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your registered email to receive OTP</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSendOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  appTitle: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#16a34a' },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  subtitle: { textAlign: 'center', marginBottom: 20, color: 'gray' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15 },
  button: { backgroundColor: '#16a34a', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
