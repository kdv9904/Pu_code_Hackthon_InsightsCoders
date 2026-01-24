import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import BottomNavigation from '../components/BottomNavigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import vendorApi from '../api/vendor';
import { NearbyVendorResponse, Category } from '../types/vendor';
import { LinearGradient } from 'expo-linear-gradient'; // Optional: Use View if not installed, but trying View for safety first

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Data State
  const [vendors, setVendors] = useState<NearbyVendorResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('Locating...');

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchLocationAndVendors(), fetchCategories()]);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLocationAndVendors(), fetchCategories()]);
    setRefreshing(false);
  };

  const fetchCategories = async () => {
      try {
          const data = await vendorApi.getAllCategories(true);
          setCategories(data);
      } catch (error) {
          console.log('Error fetching categories:', error);
      }
  };

  const fetchLocationAndVendors = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setAddress('Location Denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude
      });

      // Reverse Geocode for display
      try {
          let reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
          });
          if (reverseGeocode.length > 0) {
              const addr = reverseGeocode[0];
              setAddress(`${addr.street || addr.name || ''}, ${addr.city}`);
          } else {
              setAddress('Current Location');
          }
      } catch (e) {
          setAddress('Current Location');
      }

      // Fetch Vendors with this location
      const data = await vendorApi.getNearbyVendors(
          location.coords.latitude, 
          location.coords.longitude,
          10 // 10km radius default
      );
      setVendors(data);

    } catch (error) {
       console.log("Error getting location or vendors:", error);
       Alert.alert("Error", "Could not fetch nearby vendors. Please check location services.");
       setAddress('Unknown Location');
    }
  };

  // Filter Logic
  const filteredVendors = vendors.filter((vendor) => {
     const query = searchQuery.trim().toLowerCase();
     return vendor.businessName.toLowerCase().includes(query) || 
            vendor.vendorType.toLowerCase().includes(query);
  });

  const renderVendorCard = ({ item }: { item: NearbyVendorResponse }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('VendorDetails', { vendorId: item.vendorId })}
    >
      <View style={styles.imageContainer}>
        <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' }} 
            style={styles.vendorImage} 
        />
        <View style={styles.ratingBadge}>
             <Text style={styles.ratingText}>⭐ 4.8</Text>
        </View>
        <TouchableOpacity style={styles.likeButton}>
             <Ionicons name="heart-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.vendorContent}>
        <View style={styles.vendorHeader}>
          <Text style={styles.vendorName} numberOfLines={1}>{item.businessName}</Text>
          <View style={styles.deliveryBadge}>
             <Text style={styles.deliveryTime}>25-30 min</Text>
          </View>
        </View>
        
        <Text style={styles.vendorType}>{item.vendorType} • {item.distanceKm.toFixed(1)} km</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.vendorFooter}>
            <Text style={styles.offerText}>🎉 20% OFF up to ₹100</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = (cat: Category | { categoryId: string, name: string }) => {
       const isSelected = selectedCategory === cat.name;
       return (
        <TouchableOpacity
            key={cat.categoryId}
            style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(cat.name)}
        >
            <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
            {cat.name}
            </Text>
        </TouchableOpacity>
       );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
      
      {/* Modern Header */}
      <View style={styles.headerContainer}>
         <View style={styles.headerTop}>
             <View>
                 <Text style={styles.deliveringToLabel}>DELIVERING TO</Text>
                 <TouchableOpacity style={styles.addressRow} onPress={fetchLocationAndVendors}>
                     <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
                     <Ionicons name="chevron-down" size={16} color="#dcfce7" style={{marginLeft: 4}} />
                 </TouchableOpacity>
             </View>
             <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('UserAccount')}>
                 <Image 
                    source={{uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?fit=crop&w=100&h=100'}} 
                    style={styles.headerProfileImg} 
                 />
             </TouchableOpacity>
         </View>

         {/* Integrated Search Bar */}
         <View style={styles.searchContainer}>
             <Ionicons name="search" size={20} color="#16a34a" style={styles.searchIcon} />
             <TextInput
                placeholder="Restaurant name or dish..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
             />
             {searchQuery.length > 0 && (
                 <TouchableOpacity onPress={() => setSearchQuery('')}>
                     <Ionicons name="close-circle" size={18} color="#cbd5e1" />
                 </TouchableOpacity>
             )}
         </View>
      </View>

      {/* Content */}
      {isLoading ? (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Finding best spots nearby...</Text>
          </View>
      ) : (
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#16a34a']} />}
          >
            
            {/* Categories */}
            <View style={styles.categorySection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
                 <TouchableOpacity
                    style={[styles.categoryPill, selectedCategory === 'All' && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory('All')}
                  >
                    <Text style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}>All</Text>
                  </TouchableOpacity>
                  
                  {categories.map((cat) => renderCategoryItem(cat))}
              </ScrollView>
            </View>

            {/* Section Header */}
            <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>All Restaurants</Text>
            </View>

            {/* Vendors List */}
            {filteredVendors.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>😕</Text>
                    <Text style={styles.emptyTitle}>No vendors found</Text>
                    <Text style={styles.emptySub}>Try searching for something else or check your location.</Text>
                    <TouchableOpacity onPress={fetchLocationAndVendors} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry Location</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                filteredVendors.map((item) => (
                    <View key={item.vendorId}>
                            {renderVendorCard({ item })}
                    </View>
                ))
            )}
            
          </ScrollView>
      )}

      <BottomNavigation currentRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff', // Light slate/blue bg
  },
  headerContainer: {
    backgroundColor: '#16a34a',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
  },
  deliveringToLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#dcfce7',
      letterSpacing: 0.5,
      marginBottom: 2,
  },
  addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      maxWidth: '80%',
  },
  addressText: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
      marginRight: 4,
  },
  profileBtn: {
      padding: 2,
      backgroundColor: 'white',
      borderRadius: 20,
  },
  headerProfileImg: {
      width: 36,
      height: 36,
      borderRadius: 18,
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 50,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  searchIcon: {
      marginRight: 10,
  },
  searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#0f172a',
      fontWeight: '500',
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  loadingText: {
      marginTop: 12,
      color: '#64748b',
      fontSize: 16,
      fontWeight: '500',
  },
  content: {
      flex: 1,
      marginTop: 12,
  },
  categorySection: {
      marginBottom: 20,
  },
  categoriesContent: {
      paddingHorizontal: 16,
      paddingVertical: 4,
  },
  categoryPill: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: 'white',
      marginRight: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      borderWidth: 1,
      borderColor: 'transparent',
  },
  categoryPillActive: {
      backgroundColor: '#16a34a',
      borderColor: '#15803d',
  },
  categoryText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#64748b',
  },
  categoryTextActive: {
      color: 'white',
  },
  listHeader: {
      paddingHorizontal: 20,
      marginBottom: 12,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0f172a',
      letterSpacing: 0.3,
  },
  vendorCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
      position: 'relative',
  },
  vendorImage: {
    width: '100%',
    height: 180,
  },
  ratingBadge: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      backgroundColor: 'white',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      elevation: 2,
  },
  ratingText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#16a34a',
  },
  likeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(0,0,0,0.3)',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(10px)', // iOS only
  },
  vendorContent: {
    padding: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  deliveryBadge: {
      backgroundColor: '#f1f5f9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  deliveryTime: {
      fontSize: 11,
      fontWeight: '700',
      color: '#475569',
  },
  vendorType: {
      fontSize: 14,
      color: '#64748b',
      fontWeight: '500',
      marginBottom: 12,
  },
  divider: {
      height: 1,
      backgroundColor: '#f1f5f9',
      marginBottom: 12,
  },
  vendorFooter: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  offerText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#2563eb', // Blue for offers
  },
  emptyState: {
      alignItems: 'center',
      marginTop: 40,
      padding: 32,
  },
  emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
  },
  emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: 8,
  },
  emptySub: {
      fontSize: 14,
      color: '#64748b',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
  },
  retryBtn: {
      backgroundColor: '#0f172a',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      elevation: 2,
  },
  retryText: {
      color: 'white',
      fontWeight: '700',
  }
});
