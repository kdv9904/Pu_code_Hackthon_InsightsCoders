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

export default function ResetPassword({ route, navigation }: any) {
  const { email } = route.params;

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Missing Fields', 'Please enter the OTP and your new password.');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.resetPassword({
        email,
        otp,
        newPassword,
      });

      if (response.success || response.message?.includes('success')) {
        Alert.alert('Success', 'Password reset successfully! Login with your new password.', [
          {
            text: 'Login',
            onPress: () => navigation.replace('Login'),
          },
        ]);
      } else {
        Alert.alert('Reset Failed', response.message || 'Failed to reset password.');
      }
    } catch (error: any) {
      console.log('Reset Password Error:', error);
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
                 <Ionicons name="key-outline" size={50} color="#16a34a" style={styles.icon} />
                 <Text style={styles.title}>Reset Password</Text>
                 <Text style={styles.subtitle}>
                    Enter the OTP sent to {email} and set your new password.
                 </Text>

                 {/* OTP Input */}
                 <View style={styles.inputContainer}>
                    <Ionicons name="apps-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        placeholder="Enter OTP"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={otp}
                        onChangeText={setOtp}
                        style={styles.input}
                    />
                </View>

                {/* New Password Input */}
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        placeholder="New Password"
                        placeholderTextColor="#999"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        style={styles.input}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.7 }]}
                    onPress={handleResetPassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>RESET PASSWORD</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Back to Login</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backLink: {
      padding: 10,
  },
  backLinkText: {
      color: '#666',
      fontSize: 15,
      fontWeight: '600',
  }
});
