import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authApi from '../../api/auth';

export default function OtpScreen({ route, navigation }: any) {
  const { email } = route.params;
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.verifyOtp({ email, otpCode });

      if (response.success || response.message?.toLowerCase().includes('success')) {
        Alert.alert('Success', 'Email verified successfully!', [
          {
            text: 'Login Now',
            onPress: () => navigation.replace('Login'),
          },
        ]);
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid or expired OTP.');
      }
    } catch (error: any) {
      console.log('Verify OTP Error:', error);
      const msg = error?.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const response = await authApi.resendOtp(email);

      if (response.success || response.message?.includes('sent')) {
        Alert.alert('OTP Resent', `A new OTP has been sent to ${email}`);
      } else {
        Alert.alert('Failed', response.message || 'Failed to resend OTP.');
      }
    } catch (error: any) {
        console.log('Resend OTP Error:', error);
        const msg = error?.response?.data?.message || 'Something went wrong. Please try again.';
        Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../icons/background1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
        <View style={styles.overlay} />
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
                <Ionicons name="shield-checkmark-outline" size={50} color="#16a34a" style={styles.icon} />
                <Text style={styles.title}>Verification</Text>
                <Text style={styles.subtitle}>
                    Enter the verification code sent to
                </Text>
                <Text style={styles.emailText}>{email}</Text>

                <View style={styles.inputContainer}>
                     <TextInput
                        placeholder="000000"
                        placeholderTextColor="#ccc"
                        keyboardType="number-pad"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        maxLength={6}
                        style={styles.input}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, (otpCode.length !== 6 || loading) && styles.disabledButton]}
                    disabled={otpCode.length !== 6 || loading}
                    onPress={handleVerifyOtp}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>VERIFY</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleResendOtp} disabled={loading} style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
       </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  icon: {
      marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emailText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 30,
      marginTop: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    color: '#333',
    letterSpacing: 10,
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
      opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resendContainer: {
      padding: 10,
  },
  resendText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 15,
  },
});
