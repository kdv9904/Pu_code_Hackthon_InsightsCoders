import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from '../components/BottomNavigation';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FONTS, SHADOWS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

/* Initial Dummy Categories */
const initialCategories = [
  { id: 1, name: 'Burgers & Sides', count: 12, icon: 'fast-food-outline', bg: '#fff7ed' },
  { id: 2, name: 'Beverages', count: 8, icon: 'beer-outline', bg: '#eff6ff' },
  { id: 3, name: 'Desserts', count: 5, icon: 'ice-cream-outline', bg: '#fdf2f8' },
  { id: 4, name: 'Vegan Options', count: 14, icon: 'nutrition-outline', bg: '#ecfdf5' },
];

type User = {
  firstName: string;
  lastName: string;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<any[]>(initialCategories);

  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [saving, setSaving] = useState(false);

  /* Fetch user info */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const firstName = await AsyncStorage.getItem('firstName');
        const lastName = await AsyncStorage.getItem('lastName');
        if (firstName) {
          setUser({ 
            firstName: firstName || 'Vendor', 
            lastName: lastName || '' 
          });
        }
      } catch (e) {
        console.log('Error fetching user info', e);
      }
    };
    fetchUser();
    fetchCategories();
  },[]);

  const initials =
    ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase();

  /* Save Category API */
  const saveCategory = async () => {
    if (!categoryName.trim() || !categoryDescription.trim()) {
      Alert.alert('Error', 'Please fill both name and description');
      return;
    }

    setSaving(true);

    try {
      const response = await api.post('/vendor/categories', {
        name: categoryName,
        description: categoryDescription,
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Category created successfully!');
        setShowCreateCategory(false);
        setCategoryName('');
        setCategoryDescription('');
        fetchCategories(); 
      } else {
        Alert.alert('Error', 'Failed to create category');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong!');
    } finally {
      setSaving(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const catRes = await api.get('/vendor/categories?page=0&size=10');
      const catData = catRes.data;

      if (!Array.isArray(catData.content)) return;

      const mappedCategories = await Promise.all(
        catData.content.map(async (cat: any) => {
          try {
            const prodRes = await api.get(
              `/vendor/products?categoryId=${cat.categoryId}`
            );
            const prodData = prodRes.data;

            return {
              id: cat.categoryId,
              name: cat.name,
              count: Array.isArray(prodData.content)
                ? prodData.content.length
                : 0,
              icon: 'cube-outline', // default icon
              bg: COLORS.card,
            };
          } catch (e) {
             return {
                id: cat.categoryId,
                name: cat.name,
                count: 0,
                icon: 'cube-outline',
                bg: COLORS.card,
             };
          }
        })
      );
      setCategories(mappedCategories);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName || 'Partner'} 👋</Text>
          <Text style={styles.subGreeting}>Manage your inventory & orders</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => navigation.navigate('UserAccount')}
        >
          {initials ? (
            <Text style={styles.profileInitial}>{initials}</Text>
          ) : (
            <Ionicons name="person" size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats / Hero Card (Optional Future Enhancement) */}
        
        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setShowCreateCategory(true)}>
             <Text style={styles.actionLink}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={cat.id || index}
              style={styles.categoryCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('CategoryProducts', {
                  categoryId: cat.id,
                  categoryName: cat.name,
                })
              }
            >
              <View style={[styles.iconBox, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons 
                  name={typeof cat.icon === 'string' && cat.icon.includes('-') ? cat.icon : 'cube-outline'} 
                  size={24} 
                  color={COLORS.primary} 
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
              <Text style={styles.productCount}>{cat.count} Products</Text>
            </TouchableOpacity>
          ))}
          
          {/* Add Category Card (as part of grid) */}
          <TouchableOpacity
            style={[styles.categoryCard, styles.addCategoryCard]}
            activeOpacity={0.8}
            onPress={() => setShowCreateCategory(true)}
          >
            <View style={[styles.iconBox, { backgroundColor: COLORS.background }]}>
              <Ionicons name="add" size={28} color={COLORS.subText} />
            </View>
            <Text style={[styles.categoryName, { color: COLORS.subText }]}>Create New</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal - Create Category */}
      <Modal
        transparent
        animationType="slide"
        visible={showCreateCategory}
        onRequestClose={() => setShowCreateCategory(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalContainer}>
              <View style={styles.dragBar} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Category</Text>
                <TouchableOpacity onPress={() => setShowCreateCategory(false)}>
                  <Ionicons name="close-circle" size={28} color={COLORS.subText} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Name</Text>
              <TextInput
                placeholder="e.g. Italian Pizzas"
                placeholderTextColor={COLORS.subText}
                style={styles.input}
                value={categoryName}
                onChangeText={setCategoryName}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Describe this category..."
                placeholderTextColor={COLORS.subText}
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                multiline
                value={categoryDescription}
                onChangeText={setCategoryDescription}
              />

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={saveCategory}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? 'Creating...' : 'Create Category'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <BottomNavigation currentRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? SPACING.l : 60,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.white,
    // Add subtle shadow if needed, keeping it clean for now
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.subText,
    marginTop: 2,
  },
  profileBtn: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  profileInitial: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  scrollContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 100, // Space for Bottom Nav
    paddingTop: SPACING.m,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  actionLink: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  /* Grid Layout for Categories */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Pushes items apart
  },
  categoryCard: {
    width: (width - (SPACING.l * 2) - SPACING.m) / 2, // (Total Width - Padding - Gap) / 2
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.light,
    alignItems: 'flex-start',
  },
  addCategoryCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  productCount: {
    fontSize: 12,
    color: COLORS.subText,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.l,
    ...SHADOWS.strong,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.l,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
    marginTop: SPACING.s,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.m,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.medium,
  },
  saveText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

