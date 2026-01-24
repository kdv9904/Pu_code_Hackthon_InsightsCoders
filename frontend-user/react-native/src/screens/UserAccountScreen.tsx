import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import userApi, { UserProfileDto } from '../api/user';

type RootStackParamList = {
  // Define other routes if needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UserAccountScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { logout, user } = useAuth();
  
  // Real User Data
  const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile Form
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '', 
    image: '',
  });

  const fetchUserProfile = useCallback(async () => {
    if (!user?.userId) return;

    setLoadingProfile(true);
    try {
        const data = await userApi.getUser(user.userId);
        setUserProfile(data);
        setEditForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phoneNumber: data.phoneNumber || '',
            image: data.image || ''
        });
    } catch (error) {
        console.log("Error fetching user profile", error);
        Alert.alert("Error", "Failed to load profile data.");
    } finally {
        setLoadingProfile(false);
    }
  }, [user?.userId]);

  useFocusEffect(
      useCallback(() => {
          fetchUserProfile();
      }, [fetchUserProfile])
  );

  const onRefresh = async () => {
      setRefreshing(true);
      await fetchUserProfile();
      setRefreshing(false);
  };

  const handleUpdateProfile = async () => {
      if (!user?.userId) return;
      try {
          const updatedUser = await userApi.updateUser(user.userId, editForm);
          setUserProfile(updatedUser);
          Alert.alert("Success", "Profile updated successfully!");
      } catch (error) {
          console.log("Error updating profile", error);
          Alert.alert("Error", "Failed to update profile.");
      }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: async () => {
             await logout();
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
      >
        {loadingProfile && !refreshing && !userProfile ? (
            <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 20 }} />
        ) : (
            <>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                <Image
                    source={{ uri: userProfile?.image || 'https://via.placeholder.com/150' }}
                    style={styles.profileImage}
                />
                <Text style={styles.profileName}>
                    {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Guest User'}
                </Text>
                <Text style={styles.profileEmail}>{userProfile?.email || 'guest@example.com'}</Text>
                </View>

                {/* Edit Profile Form */}
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Edit Details</Text>
                    <View style={styles.formRow}>
                    <View style={styles.formField}>
                        <Text style={styles.formLabel}>First Name</Text>
                        <TextInput 
                            style={styles.formInput} 
                            value={editForm.firstName}
                            onChangeText={(text) => setEditForm({...editForm, firstName: text})}
                        />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.formLabel}>Last Name</Text>
                        <TextInput 
                            style={styles.formInput} 
                            value={editForm.lastName}
                            onChangeText={(text) => setEditForm({...editForm, lastName: text})}
                        />
                    </View>
                    </View>
                    <View style={styles.formFieldFull}>
                        <Text style={styles.formLabel}>Email</Text>
                        <TextInput 
                            style={[styles.formInput, { backgroundColor: '#f1f5f9', color: '#94a3b8' }]} 
                            value={userProfile?.email} 
                            editable={false} 
                        />
                    </View>
                    <View style={styles.formFieldFull}>
                        <Text style={styles.formLabel}>Phone</Text>
                        <TextInput 
                            style={styles.formInput} 
                            value={editForm.phoneNumber}
                            onChangeText={(text) => setEditForm({...editForm, phoneNumber: text})}
                            keyboardType="phone-pad" 
                        />
                    </View>
                        <View style={styles.formFieldFull}>
                        <Text style={styles.formLabel}>Profile Image URL</Text>
                        <TextInput 
                            style={styles.formInput} 
                            value={editForm.image}
                            onChangeText={(text) => setEditForm({...editForm, image: text})}
                            placeholder="https://..."
                        />
                    </View>
                    
                    <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </>
        )}

         <View style={{ height: 100 }} />
       </ScrollView>

       <BottomNavigation currentRoute="UserAccount" />
     </View>
   );
 }
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#f8fafc',
   },
   header: {
     backgroundColor: '#16a34a',
     paddingTop: 60,
     paddingBottom: 20,
     alignItems: 'center',
     justifyContent: 'center',
     borderBottomLeftRadius: 24,
     borderBottomRightRadius: 24,
     elevation: 4,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 3,
   },
   headerTitle: {
     fontSize: 24,
     fontWeight: '800',
     color: 'white',
   },
   content: {
     flex: 1,
   },
   profileCard: {
     backgroundColor: 'white',
     margin: 20,
     padding: 30,
     borderRadius: 24,
     alignItems: 'center',
     elevation: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 8,
   },
   profileImage: {
     width: 100,
     height: 100,
     borderRadius: 50,
     marginBottom: 16,
     borderWidth: 4,
     borderColor: '#f0fdf4',
   },
   profileName: {
     fontSize: 22,
     fontWeight: '800',
     color: '#1e293b',
     marginBottom: 4,
   },
   profileEmail: {
     fontSize: 14,
     color: '#64748b',
   },
   formContainer: {
     backgroundColor: 'white',
     marginHorizontal: 20,
     borderRadius: 24,
     padding: 24,
     elevation: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.05,
     shadowRadius: 5,
   },
   sectionTitle: {
       fontSize: 18,
       fontWeight: '700',
       color: '#1e293b',
       marginBottom: 20,
   },
   formRow: {
     flexDirection: 'row',
     gap: 16,
     marginBottom: 16,
   },
   formField: {
     flex: 1,
   },
   formFieldFull: {
     marginBottom: 16,
   },
   formLabel: {
     fontSize: 12,
     fontWeight: '700',
     color: '#64748b',
     marginBottom: 8,
     textTransform: 'uppercase',
     letterSpacing: 0.5,
   },
   formInput: {
     borderWidth: 1,
     borderColor: '#e2e8f0',
     borderRadius: 12,
     paddingHorizontal: 16,
     paddingVertical: 12,
     fontSize: 15,
     color: '#1e293b',
     backgroundColor: '#f8fafc',
   },
   saveButton: {
     backgroundColor: '#16a34a',
     paddingVertical: 16,
     borderRadius: 16,
     alignItems: 'center',
     marginTop: 20,
     marginBottom: 12,
     elevation: 2,
     shadowColor: '#16a34a',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
   },
   saveButtonText: {
     fontSize: 16,
     fontWeight: '700',
     color: 'white',
   },
   logoutButton: {
     backgroundColor: '#fee2e2',
     paddingVertical: 16,
     borderRadius: 16,
     alignItems: 'center',
   },
   logoutButtonText: {
     fontSize: 16,
     fontWeight: '700',
     color: '#dc2626',
   },
 });
