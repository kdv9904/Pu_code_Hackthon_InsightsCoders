import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AppStackParamList } from '../navigation/AppStack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import vendorApi from '../api/vendor';
import cartApi from '../api/cart';
import { VendorResponseDto, Product, Category, VendorCatalogResponse } from '../types/vendor';
import { CartResponseDto } from '../types/cart';
import { formatUuid } from '../utils/formatters';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'VendorDetails'>;
type VendorDetailsRouteProp = RouteProp<AppStackParamList, 'VendorDetails'>;

export default function VendorDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VendorDetailsRouteProp>();
  const rawVendorId = route.params.vendorId;
  // Ensure vendorId is formatted correctly (some backend endpoints choke on missing dashes)
  const vendorId = formatUuid(rawVendorId);

  const [vendor, setVendor] = useState<VendorResponseDto | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // New state for explicit categories
  const [cart, setCart] = useState<CartResponseDto | null>(null);
  
  // UI State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // User requested to not fetch cart on load/focus to avoid "Cart Empty" 500 errors
    /*
    const unsubscribe = navigation.addListener('focus', () => {
        fetchCart();
    });
    return unsubscribe;
    */
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await fetchCatalog();
    setIsLoading(false);
  };

  const fetchCatalog = async () => {
      try {
          const data = await vendorApi.getVendorCatalog(vendorId);
          
          // 1. Set Vendor
          setVendor({
              vendorId: data.vendor.vendorId,
              businessName: data.vendor.businessName,
              vendorType: data.vendor.vendorType,
              ratingAvg: data.vendor.rating,
              // Defaults/missing from catalog response
              userId: '', 
              verificationStatus: 'APPROVED',
              isActive: true, 
              totalReviews: 0
          });

          // 2. Set Categories
          // Map CatalogCategory to Category interface
          const mappedCategories: Category[] = data.categories.map(c => ({
              categoryId: c.categoryId,
              name: c.categoryName,
              description: '',
              isActive: true
          }));
          setCategories(mappedCategories);

          // 3. Set Products (Flattened)
          // Map CatalogProduct to Product interface
          const allProducts: Product[] = data.categories.flatMap(cat => 
            cat.products.map(p => ({
                productId: p.productId,
                name: p.name,
                description: p.description,
                price: p.price,
                stock: p.stock,
                isAvailable: p.isAvailable,
                category: { 
                    categoryId: cat.categoryId, 
                    name: cat.categoryName, 
                    description: '', 
                    isActive: true 
                },
                vendor: undefined
            }))
          );
          setProducts(allProducts);

      } catch (error) {
          console.log('Catalog fetch error:', error);
          Alert.alert("Error", "Could not load vendor catalog.");
      }
  };

  // Removed individual fetch functions
  // fetchVendorDetails, fetchVendorCategories, fetchProducts handled by catalog
  
  const fetchCart = async () => {
      try {
          const data = await cartApi.getCart();
          setCart(data);
      } catch (error) {
          console.log("Cart fetch error (might be empty):", error);
      }
  };

  const handleAddToCart = async (product: Product) => {
      setIsAddingToCart(product.productId);
      try {
          await cartApi.addToCart(product.productId, 1);
          await fetchCart();
      } catch (error) {
          console.log('Error adding to cart:', error);
          Alert.alert("Error", "Failed to add to cart");
      } finally {
          setIsAddingToCart(null);
      }
  };

  const getCartQuantity = (productId: string) => {
      if (!cart || !cart.items) return 0;
      const item = cart.items.find(i => i.productId === productId);
      return item ? item.quantity : 0;
  };

  // Group products logic
  const getFilteredProducts = () => {
       if (selectedCategoryFilter === 'All') {
           return products;
       }
       return products.filter(p => p.category?.name === selectedCategoryFilter);
  };

  // Organize for display
  const displayProducts = getFilteredProducts();
  
  // Create grouped object for section rendering if "All" is selected, 
  // or just simple list if filtered. 
  // Strategy: Use the `categories` fetch result to drive sections if possible.
  
  const renderProductList = () => {
      // If specific category selected, show flat list
      if (selectedCategoryFilter !== 'All') {
          return (
              <View style={styles.productsSection}>
                 <Text style={styles.sectionTitle}>{selectedCategoryFilter}</Text>
                 {displayProducts.length > 0 ? (
                     displayProducts.map(renderProductCard)
                 ) : (
                     <Text style={styles.emptyText}>No products in this category.</Text>
                 )}
              </View>
          );
      }

      // If "All", group by categories found in `categories` state + any extras
      // We iterate through fetched `categories` to maintain their order
      const grouped: { [key: string]: Product[] } = {};
      
      // Initialize with known categories
      categories.forEach(c => { grouped[c.name] = [] });
      grouped['Other'] = []; // Catch-all

      products.forEach(p => {
          const catName = p.category?.name || 'Other';
          if (!grouped[catName]) grouped[catName] = []; // In case product has category not in list?
          grouped[catName].push(p);
      });

      return Object.entries(grouped).map(([categoryName, items]) => {
          if (items.length === 0) return null; // Don't show empty sections
          return (
              <View key={categoryName} style={styles.productsSection}>
                  <Text style={styles.sectionTitle}>{categoryName}</Text>
                  {items.map(renderProductCard)}
              </View>
          );
      });
  };

  const renderProductCard = (product: Product) => (
       <View key={product.productId} style={styles.productCard}>
            <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&h=200&fit=crop' }} 
            style={styles.productImage} 
            />
            <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
            <View style={styles.priceRow}>
                <Text style={styles.productPrice}>₹{product.price}</Text>
                
                {product.isAvailable ? (
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => handleAddToCart(product)}
                        disabled={isAddingToCart === product.productId}
                    >
                        {isAddingToCart === product.productId ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.addButtonText}>
                                {getCartQuantity(product.productId) > 0 ? `Add (${getCartQuantity(product.productId)})` : 'Add'}
                            </Text>
                        )}
                    </TouchableOpacity>
                ) : (
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                )}
            </View>
            </View>
        </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Vendor not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{vendor.businessName}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vendor Info Card */}
        <View style={styles.vendorCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' }} 
            style={styles.vendorImage} 
          />
          <View style={styles.vendorInfo}>
            <View style={styles.vendorHeader}>
              <Text style={styles.vendorName}>{vendor.businessName}</Text>
              <View style={[styles.statusBadge, vendor.isActive ? styles.statusOpen : styles.statusClosed]}>
                 <Text style={styles.statusText}>{vendor.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <View style={styles.vendorMeta}>
              <Text style={styles.vendorRating}>⭐ {vendor.ratingAvg ? vendor.ratingAvg.toFixed(1) : 'New'}</Text>
              <Text style={styles.vendorDistance}>{vendor.vendorType}</Text>
            </View>
          </View>
        </View>

        {/* Categories Horizontal Filter */}
        {categories.length > 0 && (
            <View style={styles.categoryFilterContainer}>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity 
                        style={[styles.catFilterChip, selectedCategoryFilter === 'All' && styles.catFilterChipActive]}
                        onPress={() => setSelectedCategoryFilter('All')}
                    >
                        <Text style={[styles.catFilterText, selectedCategoryFilter === 'All' && styles.catFilterTextActive]}>All</Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                         <TouchableOpacity 
                            key={cat.categoryId}
                            style={[styles.catFilterChip, selectedCategoryFilter === cat.name && styles.catFilterChipActive]}
                            onPress={() => setSelectedCategoryFilter(cat.name)}
                        >
                            <Text style={[styles.catFilterText, selectedCategoryFilter === cat.name && styles.catFilterTextActive]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                 </ScrollView>
            </View>
        )}

        {/* Products List */}
        {products.length === 0 ? (
            <View style={styles.center}>
                <Text style={{color:'#64748b', marginTop: 30}}>No products found for this vendor.</Text>
            </View>
        ) : (
            renderProductList()
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Cart Button */}
      {cart && cart.items && cart.items.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.viewCartButton}
              onPress={() => navigation.navigate('OrderFlow', { vendorId: vendorId, vendorName: vendor.businessName })}
            >
              <View style={styles.cartInfo}>
                  <Text style={styles.cartCount}>{cart.items.length} Items</Text>
                  <Text style={styles.cartTotal}>₹{cart.totalAmount}</Text>
              </View>
              <Text style={styles.viewCartText}>View Cart &rarr;</Text>
            </TouchableOpacity>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  center: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
    backgroundColor: '#16a34a',
    paddingTop: 45, 
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  vendorCard: {
    backgroundColor: 'white',
    marginBottom: 10,
    elevation: 2,
  },
  vendorImage: {
    width: '100%',
    height: 180,
  },
  vendorInfo: {
    padding: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#dcfce7',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#000',
  },
  vendorMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  vendorRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  vendorDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryFilterContainer: {
      paddingVertical: 12,
      paddingLeft: 16,
      backgroundColor: 'white',
      marginBottom: 10,
  },
  catFilterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f1f5f9',
      marginRight: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
  },
  catFilterChipActive: {
      backgroundColor: '#dcfce7',
      borderColor: '#16a34a',
  },
  catFilterText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#64748b',
  },
  catFilterTextActive: {
      color: '#16a34a',
  },
  productsSection: {
    paddingHorizontal: 16,
    marginTop: 8, // Reduced margin
    marginBottom: 8, 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  productDescription: {
      fontSize: 12,
      color: '#94a3b8',
      marginBottom: 8,
  },
  priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  addButton: {
      backgroundColor: '#f0fdf4',
      borderWidth: 1,
      borderColor: '#16a34a',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      minWidth: 60,
      alignItems: 'center',
  },
  addButtonText: {
      color: '#16a34a',
      fontWeight: '700',
      fontSize: 12,
  },
  outOfStockText: {
      color: '#dc2626',
      fontSize: 12,
      fontWeight: '600',
  },
  emptyText: {
      color: '#94a3b8',
      fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 8,
  },
  viewCartButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartInfo: {
      flexDirection: 'column',
  },
  cartCount: {
      color: '#dcfce7',
      fontSize: 12,
      fontWeight: '600',
  },
  cartTotal: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
  },
  viewCartText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
  },
});
