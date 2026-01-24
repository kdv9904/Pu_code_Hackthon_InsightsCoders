import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import api, { getOrderById, acceptOrder, rejectOrder } from '../services/api';
import { COLORS, SHADOWS, SPACING } from '../constants/theme';
import { AppStackParamList } from '../navigation/AppStack';

type OrderDetailsScreenRouteProp = RouteProp<AppStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<OrderDetailsScreenRouteProp>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrderById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Fetch order details error:', error);
      Alert.alert('Error', 'Failed to fetch order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await acceptOrder(orderId);
      Alert.alert('Success', 'Order Accepted');
      fetchOrderDetails(); // Refresh
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to accept order';
      Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }
    setProcessing(true);
    setRejectModalVisible(false);
    try {
      await rejectOrder(orderId, rejectReason);
      Alert.alert('Success', 'Order Rejected');
      fetchOrderDetails(); // Refresh
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to reject order';
      Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return COLORS.primary;
      case 'REJECTED': return COLORS.error;
      case 'PLACED': return '#f59e0b';
      default: return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) return null;

  const isPending = order.status === 'PENDING' || order.status === 'PLACED';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Order Status Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Order #{order.orderId.substring(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
               <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>Placed on {new Date(order.createdAt).toLocaleString()}</Text>
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
           <Text style={styles.sectionTitle}>Customer Details</Text>
           {order.deliveryAddress && (
             <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={COLORS.subText} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Delivery Address</Text>
                  <Text style={styles.infoValue}>{order.deliveryAddress.addressLine}</Text>
                  <Text style={styles.infoValue}>
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                  </Text>
                   {order.deliveryAddress.phone && <Text style={styles.infoValue}>Phone: {order.deliveryAddress.phone}</Text>}
                </View>
             </View>
           )}
           {/* Fallback if user details are at root */}
           {(!order.deliveryAddress && order.user) && (
              <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={COLORS.subText} />
                  <Text style={styles.infoValue}>{order.user.firstName} {order.user.lastName}</Text>
              </View>
           )}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
               <View style={styles.quantityBadge}>
                 <Text style={styles.quantityText}>{item.quantity}x</Text>
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.itemName}>{item.productName}</Text>
                 <Text style={styles.itemPrice}>₹{item.price}</Text>
               </View>
               <Text style={styles.itemTotal}>₹{item.total || item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Footer Actions */}
      {isPending && (
        <View style={styles.footer}>
           {processing ? (
             <ActivityIndicator color={COLORS.primary} />
           ) : (
             <>
               <TouchableOpacity 
                 style={[styles.actionBtn, styles.rejectBtn]}
                 onPress={() => setRejectModalVisible(true)}
               >
                 <Text style={styles.rejectBtnText}>Reject Order</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                 style={[styles.actionBtn, styles.acceptBtn]}
                 onPress={handleAccept}
               >
                 <Text style={styles.acceptBtnText}>Accept Order</Text>
               </TouchableOpacity>
             </>
           )}
        </View>
      )}

      {/* Reject Modal */}
      <Modal
         visible={rejectModalVisible}
         transparent
         animationType="fade"
         onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reject Order</Text>
            <Text style={styles.modalSubtitle}>Please specify a reason for rejection.</Text>
            
            <TextInput
              style={styles.input}
              placeholder="e.g. Item out of stock"
              placeholderTextColor={COLORS.subText}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmRejectBtn]} 
                onPress={handleReject}
              >
                <Text style={styles.confirmRejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    paddingHorizontal: SPACING.m,
    paddingTop: Platform.OS === 'android' ? SPACING.l : 50,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.light,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.s,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  quantityBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quantityText: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  itemName: {
     fontSize: 14,
     color: COLORS.text,
     fontWeight: '500',
  },
  itemPrice: {
    fontSize: 12,
    color: COLORS.subText,
  },
  itemTotal: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.m,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  footer: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     backgroundColor: COLORS.white,
     padding: SPACING.m,
     flexDirection: 'row',
     gap: SPACING.m,
     ...SHADOWS.strong,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectBtnText: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.l,
    ...SHADOWS.strong,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.subText,
    marginBottom: SPACING.m,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
    color: COLORS.text,
    marginBottom: SPACING.l,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.background,
  },
  confirmRejectBtn: {
    backgroundColor: COLORS.error,
  },
  cancelText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  confirmRejectText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
