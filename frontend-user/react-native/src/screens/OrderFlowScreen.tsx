import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

import cartApi from '../api/cart';
import orderApi from '../api/order';
import { CartResponseDto } from '../types/cart';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderFlow'>;
type OrderFlowRouteProp = RouteProp<RootStackParamList, 'OrderFlow'>;

export default function OrderFlowScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderFlowRouteProp>();
  // params might contain vendorId/Name for context, but we rely on server cart state
  const { vendorName } = route.params;

  const [cart, setCart] = useState<CartResponseDto | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Checkout Form State
  const [societyName, setSocietyName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (error) {
      console.log("Error fetching cart:", error);
      // If error (e.g. 404), assumes empty cart
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
      try {
          await cartApi.removeItem(itemId);
          fetchCart();
      } catch (error) {
          Alert.alert("Error", "Could not remove item.");
      }
  };

  const clearCart = async () => {
    try {
        await cartApi.clearCart();
        setCart(null);
        navigation.goBack();
    } catch (error) {
        Alert.alert("Error", "Could not clear cart.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!societyName || !houseNumber || !phoneNumber) {
        Alert.alert("Missing Info", "Please fill in all address and contact details.");
        return;
    }

    setPlacingOrder(true);
    try {
        await orderApi.placeOrder({
            societyName,
            houseNumber,
            phoneNumber
        });
        setShowSuccessModal(true);
        setTimeout(() => {
            setShowSuccessModal(false);
            navigation.navigate('Home'); // Or separate OrderSuccess screen
        }, 2500);
    } catch (error) {
        console.log("Place order error:", error);
        Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
        setPlacingOrder(false);
    }
  };

  if (loading) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color="#16a34a" />
          </View>
      );
  }

  // Empty Cart State
  if (!cart || !cart.items || cart.items.length === 0) {
      return (
          <View style={[styles.container, styles.center]}>
              <Text style={{ fontSize: 18, color: '#64748b' }}>Your cart is empty.</Text>
              <TouchableOpacity style={styles.backButtonGeneral} onPress={() => navigation.goBack()}>
                  <Text style={styles.backButtonTextGeneral}>Go Back</Text>
              </TouchableOpacity>
          </View>
      );
  }

  // Calculations
  // Total is coming from Server usually, but let's recalculate or use server's total check
  const serverTotal = cart.totalAmount || 0; 
  // If server doesn't provide tax/delivery breakdown in cart response (it likely does internally or we compute client side)
  // For now we assume serverCart.totalAmount is the final subtotal of items. 
  // Let's add dummy delivery fee if needed, or assume included. 
  // Given API PlaceOrder doesn't seem to calculate fees in response description, 
  // let's assume totalAmount in cart response is what we pay, or we add small fee UI-side.
  const deliveryFee = 20; 
  const grandTotal = serverTotal + deliveryFee;

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
        <Text style={styles.headerTitle}>Checkout</Text>
        {currentStep === 1 && (
             <TouchableOpacity onPress={clearCart}>
                 <Text style={{color: 'white', fontWeight: '600'}}>Clear</Text>
             </TouchableOpacity>
        )}
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={styles.stepContainer}>
          <View style={[styles.step, currentStep >= 1 && styles.stepActive]}>
            <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Cart</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepContainer}>
          <View style={[styles.step, currentStep >= 2 && styles.stepActive]}>
            <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Details</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Step 1: Review Cart */}
        {currentStep === 1 && (
          <View style={styles.section}>
            <Text style={styles.vendorHeading}>Ordering from {vendorName || cart.vendorName}</Text>
            
            {cart.items.map((item) => (
              <View key={item.cartItemId} style={styles.cartItem}>
                {/* Image Placeholder */}
                <Image source={{ uri: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&h=200&fit=crop' }} style={styles.cartItemImage} />
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.productName}</Text>
                  <Text style={styles.cartItemPrice}>
                    ₹{item.price} x {item.quantity}
                  </Text>
                </View>
                <View style={styles.cartItemActions}>
                    <Text style={{fontWeight: '700', fontSize: 16, marginRight: 10}}>₹{item.price * item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeItem(item.cartItemId)}
                        >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Item Total</Text>
                <Text style={styles.priceValue}>₹{serverTotal}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>₹{deliveryFee}</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.totalValue}>₹{grandTotal}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Details & Confirm */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            
            <View style={styles.formGroup}>
                <Text style={styles.label}>Society / Building Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Green Valley Apartments"
                    value={societyName}
                    onChangeText={setSocietyName}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>House Number / Flat No</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. B-402"
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                />
            </View>

             <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 9876543210"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />
            </View>

            <Text style={styles.sectionTitle}>Order Summary</Text>
             <View style={styles.priceCard}>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{grandTotal}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
          {currentStep === 1 ? (
             <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.primaryButtonText}>Proceed to Checkout</Text>
              </TouchableOpacity>
          ) : (
             <TouchableOpacity
                style={styles.primaryButton}
                onPress={handlePlaceOrder}
                disabled={placingOrder}
              >
                {placingOrder ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.primaryButtonText}>Confirm & Place Order</Text>
                )}
              </TouchableOpacity>
          )}
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successMessage}>Waiting for vendor acceptance...</Text>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    elevation: 4,
  },
  backButton: {
    // padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 1,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepActive: {
    backgroundColor: '#16a34a',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  stepLine: {
    height: 2,
    backgroundColor: '#e2e8f0',
    flex: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  vendorHeading: {
      fontSize: 16,
      color: '#64748b',
      marginBottom: 12,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  cartItemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  removeButton: {
    padding: 8,
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    marginTop: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: 12,
      marginTop: 8,
  },
  formGroup: {
      marginBottom: 16,
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#334155',
      marginBottom: 6,
  },
  input: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  backButtonGeneral: {
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: '#16a34a',
      borderRadius: 8,
  },
  backButtonTextGeneral: {
      color: 'white',
      fontWeight: '600',
  }
});
