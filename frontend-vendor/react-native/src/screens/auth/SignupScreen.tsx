import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../constants/theme';

export default function SignupScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password || !phoneNumber || !image) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/signup', {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        image,
      });

      const data = response.data;
      if (!data && !response.status) { 
        Alert.alert('Signup Failed', 'Something went wrong');
        return;
      }

      Alert.alert('Success', 'Account created! Please verify OTP sent to your email.');
      navigation.navigate('Otp', { email });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Unable to signup. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string, 
    value: string, 
    setValue: (t: string) => void, 
    icon: string, 
    placeholder: string,
    isSecure = false,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <Ionicons name={icon} size={20} color={COLORS.subText} style={{ marginRight: 10 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.subText}
          value={value}
          onChangeText={setValue}
          style={styles.input}
          secureTextEntry={isSecure && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {isSecure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
             <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.subText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleContainer}>
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subText}>Join us and start selling today</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={{ flexDirection: 'row', gap: SPACING.m }}>
            <View style={{ flex: 1 }}>
              {renderInput("First Name", firstName, setFirstName, "person-outline", "John")}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput("Last Name", lastName, setLastName, "person-outline", "Doe")}
            </View>
          </View>

          {renderInput("Email Address", email, setEmail, "mail-outline", "john@example.com", false, 'email-address')}
          {renderInput("Password", password, setPassword, "lock-closed-outline", "Min. 6 characters", true)}
          {renderInput("Phone Number", phoneNumber, setPhoneNumber, "call-outline", "1234567890", false, 'phone-pad')}
          {renderInput("Profile Image URL", image, setImage, "image-outline", "https://example.com/me.jpg")}

          <TouchableOpacity style={styles.signupBtn} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.signupBtnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
             <Text style={{ color: COLORS.subText }}>Already have an account? </Text>
             <TouchableOpacity onPress={() => navigation.navigate('Login')}>
               <Text style={styles.loginText}>Log In</Text>
             </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? SPACING.l : 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingBottom: 50,
  },
  titleContainer: {
    marginBottom: SPACING.l,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  subText: {
    fontSize: 16,
    color: COLORS.subText,
  },
  formContainer: {
    marginTop: SPACING.m,
  },
  inputWrapper: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
    height: 50,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  signupBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.s,
    marginBottom: SPACING.l,
    ...SHADOWS.medium,
  },
  signupBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

