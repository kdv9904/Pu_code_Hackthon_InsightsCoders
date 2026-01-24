import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { updateVendorProfile } from '../services/api';
import { COLORS, SHADOWS, SPACING } from '../constants/theme';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { setIsLoggedIn, setVerificationStatus } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorId, setVendorId] = useState('');
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  // Initial Fetch
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/vendor/me');
      const data = response.data;
      
      setVendorId(data.vendorId || '');
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
      setBusinessName(data.businessName || '');
      
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        firstName,
        lastName,
        phone,
        businessName, // If backend supports updating business name
      };
      
      await updateVendorProfile(payload);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (error: any) {
      console.error('Update profile error:', error);
      const msg = error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
             try {
              // Optional: Call backend logout
              try { await api.post('/auth/logout'); } catch (e) { console.log('Api logout failed', e); }
        
              // Clear local storage
              await AsyncStorage.clear();
        
              // Reset auth state
              setIsLoggedIn(false);
              setVerificationStatus(null);
        
              // Hard Reset
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
             } catch (error) {
               console.error('Logout error:', error);
             }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Profile Image - Placeholder for now as API might not support image upload yet */}
        <View style={styles.profileSection}>
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200',
              }}
              style={styles.avatar}
            />
            {/* <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity> */}
          </View>

          {vendorId ? (
             <Text style={styles.userId}>ID: {vendorId}</Text>
          ) : null}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input 
            label="FIRST NAME" 
            value={firstName} 
            onChangeText={setFirstName} 
          />
          <Input 
            label="LAST NAME" 
            value={lastName} 
            onChangeText={setLastName} 
          />
           <Input 
            label="BUSINESS NAME" 
            value={businessName} 
            editable={false} // Often business name isn't editable
          />
          <Input 
            label="PHONE" 
            value={phone} 
            onChangeText={setPhone} 
            keyboardType="phone-pad" 
          />
         

          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
               <ActivityIndicator color="#fff" /> 
            ) : (
               <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* Reusable Input */
const Input = ({ 
  label, 
  value, 
  onChangeText, 
  editable = true,
  keyboardType = 'default'
}: { 
  label: string; 
  value: string; 
  onChangeText?: (text: string) => void;
  editable?: boolean;
  keyboardType?: any;
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      style={[styles.input, !editable && { backgroundColor: '#f1f5f9', color: '#94a3b8' }]}
      placeholderTextColor="#94a3b8"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  editIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#22c55e',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userId: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 10,
  },

  form: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.light,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
  },

  saveButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  logoutButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
