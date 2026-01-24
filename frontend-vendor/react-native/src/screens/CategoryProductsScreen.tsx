import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FONTS, SHADOWS, SPACING } from '../constants/theme';

export default function CategoryProductsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { categoryId, categoryName } = route.params;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Handle Back Navigation Robustly
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  // 🔹 Fetch image for a single product
  const fetchProductImage = async (productId: number) => {
    try {
      const res = await api.get(`/vendor/products/${productId}/images`);
      const images = res.data;
      
      if (!Array.isArray(images) || images.length === 0) return null;

      // Find primary image
      const primary = images.find((img: any) => img.isPrimary) || images[0];

      // imageUrl is already full URL from Cloudinary
     return primary.imageUrl ? `${primary.imageUrl}?t=${Date.now()}` : null;

    } catch (err: any) {
      console.log('Image fetch error:', err.message);
      return null;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get(`/vendor/products?categoryId=${categoryId}`);
        const result = res.data;

        const productList = result.content || [];

        // 🔥 Fetch images in parallel
        const mappedProducts = await Promise.all(
          productList.map(async (p: any) => ({
            id: p.productId, 
            name: p.name,
            size: p.unit || '',
            price: `₹${p.price}`,
            stock: p.stock > 0 ? `${p.stock} available` : 'Out of Stock',
            inStock: p.stock > 0,
            image: await fetchProductImage(p.productId), 
          }))
        );

        setProducts(mappedProducts);
      } catch (error: any) {
        console.log('Fetch products error:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{categoryName}</Text>
          <Text style={styles.subTitle}>
            {products.length} Items Found
          </Text>
        </View>

        <TouchableOpacity style={styles.searchBtn}>
           <Ionicons name="search-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* PRODUCTS */}
      <FlatList
        data={products}
        keyExtractor={(item, index) => (item.id ?? index).toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={ item.image ? { uri: item.image } : { uri: 'https://via.placeholder.com/150' } }
              style={styles.imageBox}
              resizeMode="cover"
            />

            <View style={styles.cardContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                 <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                 <TouchableOpacity>
                   <Ionicons name="ellipsis-vertical" size={18} color={COLORS.subText} />
                 </TouchableOpacity>
              </View>
              
              <Text style={styles.size}>{item.size}</Text>

              <View style={styles.row}>
                <Text style={styles.price}>{item.price}</Text>
                <View style={[
                  styles.stockBadge, 
                  { backgroundColor: item.inStock ? COLORS.primaryLight : '#fee2e2' }
                ]}>
                  <Text
                    style={[
                      styles.stock,
                      { color: item.inStock ? COLORS.primaryDark : COLORS.error },
                    ]}
                  >
                    {item.stock}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* CREATE PRODUCT FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('AddProduct', {
            categoryId,
            categoryName,
          })
        }
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
        <Text style={styles.fabText}>New</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? SPACING.l : 50,
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  searchBtn: {
     padding: SPACING.s,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subTitle: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
  },
  listContent: {
    padding: SPACING.l,
    paddingBottom: 100, 
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    ...SHADOWS.light,
  },
  imageBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: SPACING.m,
    backgroundColor: COLORS.background,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  size: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: SPACING.s,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stock: {
    fontSize: 10,
    fontWeight: '700',
  },
  
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.l,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    ...SHADOWS.strong,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
});

