import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { COLORS, FONTS, SHADOWS, SPACING } from '../constants/theme';
import BottomNavigation from '../components/BottomNavigation';

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  orderId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PLACED';
  houseNumber: string | null;
  societyName: string | null;
  phoneNumber: string | null;
  vendorName: string;
}

export default function OrderFlowScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/vendor/orders');
      setOrders(response.data);
    } catch (error: any) {
      console.error('Fetch orders error:', error);
      // Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleAccept = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await api.put(`/vendor/orders/${orderId}/accept`);
      Alert.alert('Success', 'Order Accepted');
      fetchOrders(); // Refresh list
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to accept order';
      Alert.alert('Error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!selectedOrderId || !rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }

    setProcessingId(selectedOrderId);
    setRejectModalVisible(false); // Close modal immediately

    try {
      await api.put(`/vendor/orders/${selectedOrderId}/reject`, {
        reason: rejectReason,
      });
      Alert.alert('Success', 'Order Rejected');
      fetchOrders();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to reject order';
      Alert.alert('Error', msg);
    } finally {
      setProcessingId(null);
      setSelectedOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return COLORS.primary;
      case 'REJECTED':
        return COLORS.error;
      case 'PLACED':
      case 'PENDING':
      default:
        return '#f59e0b'; // Amber for Pending/Placed
    }
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isProcessing = processingId === item.orderId;
    const isPending = item.status === 'PENDING' || item.status === 'PLACED';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.orderId })}
        activeOpacity={0.9}
      >
        {/* Header: ID & Status */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.orderId.substring(0, 8)}</Text>
            <Text style={styles.orderDate}>Today, 10:30 AM</Text> 
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Items List */}
        <View style={styles.itemsContainer}>
          {item.items.map((prod, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemText}>
                <Text style={{ fontWeight: 'bold' }}>{prod.quantity}x</Text> {prod.productName}
              </Text>
              <Text style={styles.itemPrice}>₹{prod.price * prod.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Total & Customer Info */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.customerInfo}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
          </View>
          
          {/* Action Buttons for Pending Orders */}
          {isPending ? (
            <View style={styles.actionButtons}>
              {isProcessing ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <TouchableOpacity 
                    style={[styles.btn, styles.rejectBtn]} 
                    onPress={() => openRejectModal(item.orderId)}
                  >
                    <Ionicons name="close" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.btn, styles.acceptBtn]} 
                    onPress={() => handleAccept(item.orderId)}
                  >
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={24} color={COLORS.subText} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Orders</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.subText} />
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          }
        />
      )}

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
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

      <BottomNavigation currentRoute="Orders" />
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
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: Platform.OS === 'android' ? SPACING.l : 50,
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshBtn: {
    padding: SPACING.s,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  listContent: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: SPACING.m,
    color: COLORS.subText,
    fontSize: 16,
  },
  
  /* Card Styles */
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.m,
  },
  itemsContainer: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    fontSize: 12,
    color: COLORS.subText,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  btn: {
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...SHADOWS.light,
  },
  rejectBtn: {
    width: 40,
    backgroundColor: '#fee2e2',
  },
  acceptBtn: {
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    gap: 4,
  },
  acceptText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Modal Styles */
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
