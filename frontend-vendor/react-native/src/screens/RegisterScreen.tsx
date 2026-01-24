import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, FONTS, SHADOWS, SPACING } from '../constants/theme';

export default function RegisterScreen({ navigation }: any) {
  const { setVerificationStatus, setIsLoggedIn } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [vendorType, setVendorType] = useState<'FIXED' | 'MOBILE'>('FIXED');
  
  // Location State
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  const [loading, setLoading] = useState(false);

  // 📍 Function to Detect Location
  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to detect address.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setLatitude(String(latitude));
      setLongitude(String(longitude));

      // Reverse Geocoding
      const place = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (place && place.length > 0) {
        const address = place[0];
        setAddressLine(`${address.name || ''} ${address.street || ''}`.trim());
        setArea(address.district || address.subregion || '');
        setCity(address.city || '');
        setState(address.region || '');
        setCountry(address.country || '');
        setPincode(address.postalCode || '');
      }

      Alert.alert('Success', 'Location detected successfully!');

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to fetch location. Please enter manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleRegister = async () => {
    if (
      !businessName ||
      !addressLine ||
      !area ||
      !city ||
      !state ||
      !country ||
      !pincode ||
      !latitude ||
      !longitude
    ) {
      Alert.alert('Error', 'Please fill all details or use Detect Location');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        businessName,
        vendorType,
        location: {
          addressLine,
          area,
          city,
          state,
          country,
          pincode,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      };

      const response = await api.post('/vendor/register', payload);
      
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Business registered successfully!');
        await AsyncStorage.setItem('verificationStatus', 'PENDING');
        setVerificationStatus('PENDING');
        // Navigation handled by RootNavigator in App.tsx due to state change
      } else {
         Alert.alert('Error', 'Registration failed. Try again.');
      }

    } catch (error: any) {
      console.log(error);
      const msg = error.response?.data?.message || 'Something went wrong';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    await AsyncStorage.clear();
    setVerificationStatus(null);
    setIsLoggedIn(false);
  };

  const renderInput = (
    placeholder: string,
    value: string,
    setValue: (t: string) => void,
    icon: string,
    keyboardType: any = 'default',
    editable = true
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{placeholder}</Text>
      <View style={styles.inputBox}>
        <Ionicons name={icon} size={20} color={COLORS.subText} style={{ marginRight: 10 }} />
        <TextInput
          placeholder={`Enter ${placeholder}`}
          placeholderTextColor={COLORS.subText}
          value={value}
          onChangeText={setValue}
          style={styles.input}
          keyboardType={keyboardType}
          editable={editable}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Setup</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.stepText}>Step 1 of 1</Text>

        <Text style={styles.sectionTitle}>Business Details</Text>
        <Text style={styles.sectionSubtitle}>Tell us about your delivery operations.</Text>

        {renderInput("Business Name", businessName, setBusinessName, "briefcase-outline")}

        <Text style={styles.inputLabel}>Vendor Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeBtn, vendorType === 'FIXED' && styles.typeBtnActive]}
            onPress={() => setVendorType('FIXED')}
          >
            <Ionicons name="storefront-outline" size={24} color={vendorType === 'FIXED' ? COLORS.primary : COLORS.subText} />
            <Text style={[styles.typeText, vendorType === 'FIXED' && styles.typeTextActive]}>Fixed Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, vendorType === 'MOBILE' && styles.typeBtnActive]}
            onPress={() => setVendorType('MOBILE')}
          >
            <Ionicons name="bicycle-outline" size={24} color={vendorType === 'MOBILE' ? COLORS.primary : COLORS.subText} />
            <Text style={[styles.typeText, vendorType === 'MOBILE' && styles.typeTextActive]}>Mobile Vendor</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
          <Text style={styles.sectionTitle}>Business Location</Text>
          <TouchableOpacity onPress={detectLocation} style={styles.detectBtn}>
            {locationLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
               <Ionicons name="locate" size={16} color={COLORS.primary} />
               <Text style={styles.detectText}>Detect Current</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {renderInput("Address Line", addressLine, setAddressLine, "location-outline")}
        
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: SPACING.s }}>
            {renderInput("Area", area, setArea, "map-outline")}
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.s }}>
            {renderInput("City", city, setCity, "business-outline")}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: SPACING.s }}>
            {renderInput("State", state, setState, "map-outline")}
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.s }}>
            {renderInput("Pincode", pincode, setPincode, "navigate-circle-outline", 'numeric')}
          </View>
        </View>

        {renderInput("Country", country, setCountry, "flag-outline")}

        {/* Hidden but required lat/long visualization (optional) */}
        {/* <Text style={{ fontSize: 10, color: COLORS.subText, textAlign: 'center' }}>
           Lat: {latitude}, Long: {longitude}
        </Text> */}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Complete Registration</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? SPACING.l : 50,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  backBtn: {
    padding: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingBottom: 50,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.s,
  },
  progressFill: {
    width: '80%', // Assume step 4/5 or similar
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.subText,
    marginBottom: SPACING.l,
  },
  inputContainer: {
    marginBottom: SPACING.m,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
    fontSize: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.l,
    gap: SPACING.m,
  },
  typeBtn: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  typeText: {
    marginTop: SPACING.s,
    fontWeight: '600',
    color: COLORS.subText,
  },
  typeTextActive: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.l,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detectText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: SPACING.l,
    ...SHADOWS.medium,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
