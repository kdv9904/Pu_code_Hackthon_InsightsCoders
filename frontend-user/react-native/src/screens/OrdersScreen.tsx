import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomNavigation from '../components/BottomNavigation';
import orderApi from '../api/order';
import { OrderResponseDto } from '../types/order';

type AppStackParamList = {
    Home: undefined;
    Orders: undefined;
    UserAccount: undefined;
};

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function OrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [orders, setOrders] = useState<OrderResponseDto[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await orderApi.getOrders();
      // Reverse to show newest first, assuming API returns oldest first
      setOrders(data.reverse()); 
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: OrderResponseDto) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCancelOrder = () => {
    Alert.alert("Notice", "Cancellation not yet implemented via API.");
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await orderApi.completeOrder(orderId);
      Alert.alert("Success", "Order marked as completed!");
      
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'COMPLETED' } : o));
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'COMPLETED' });
      }
      setShowOrderModal(false);
    } catch (error) {
      console.log("Error completing order:", error);
      Alert.alert("Error", "Could not complete order. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return '#2563eb';    // Blue
      case 'PLACED': return '#f59e0b';      // Orange
      case 'REJECTED':
      case 'CANCELLED': return '#dc2626';   // Red
      case 'DELIVERED': 
      case 'COMPLETED': return '#16a34a';   // Green
      case 'OUT_FOR_DELIVERY': return '#9333ea'; // Purple
      default: return '#64748b';
    }
  };
  
  const getStatusText = (status: string) => {
      return status.replace(/_/g, ' ');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
      >
          <View style={styles.listContent}>
            {isLoadingOrders && !refreshing ? (
                <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 20 }} />
            ) : orders.length === 0 ? (
                <Text style={styles.emptyText}>No recent orders found.</Text>
            ) : (
                orders.map((order) => (
                <TouchableOpacity 
                    key={order.orderId} 
                    style={styles.orderCard}
                    activeOpacity={0.9}
                    onPress={() => handleOrderPress(order)}
                >
                    <View style={styles.cardHeader}>
                        <Text style={styles.vendorNameTitle} numberOfLines={1}>{order.vendorName || 'Unknown Vendor'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                        </View>
                    </View>

                    <View style={styles.cardSubHeader}>
                        <Text style={styles.orderIdSub}>Order #{order.orderId.substring(0, 8).toUpperCase()}</Text>
                        <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
                    </View>
                    
                    <View style={styles.dividerSmall} />
                    
                    <Text style={styles.itemsText} numberOfLines={2}>
                        {order.items?.map(i => i.productName).join(', ') || 'Various Items'}
                    </Text>

                    <View style={styles.viewDetailsButton}>
                        <Text style={styles.viewDetailsText}>View Details</Text>
                    </View>
                </TouchableOpacity>
                ))
            )}
          </View>
          
          <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation currentRoute="Orders" />

      {/* Order Details Modal */}
      <Modal visible={showOrderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  {/* Vendor Name Top */}
                  <Text style={styles.modalVendorNameTitle}>{selectedOrder.vendorName}</Text>
                  
                  <View style={styles.modalTopRow}>
                    <Text style={styles.modalOrderIdSub}>#{selectedOrder.orderId.substring(0, 8).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedOrder.status)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoSection}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📍</Text>
                        <Text style={styles.detailText}>{selectedOrder.societyName}, {selectedOrder.houseNumber}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📞</Text>
                        <Text style={styles.detailText}>{selectedOrder.phoneNumber}</Text>
                      </View>
                  </View>
                  
                  <Text style={styles.sectionTitleModal}>Items Summary</Text>
                  <View style={styles.itemsList}>
                    {selectedOrder.items?.map((item, idx) => (
                        <View key={idx} style={styles.itemRowModal}>
                            <Text style={styles.itemNameModal}>{item.productName} <Text style={{color:'#94a3b8'}}>x{item.quantity}</Text></Text>
                            <Text style={styles.itemPriceModal}>₹{item.price * item.quantity}</Text>
                        </View>
                    ))}
                  </View>

                  <View style={styles.divider} />
                  <View style={styles.totalRowModal}>
                        <Text style={styles.totalLabelModal}>Total Amount</Text>
                        <Text style={styles.totalValueModal}>₹{selectedOrder.totalAmount}</Text>
                  </View>

                  {selectedOrder.status === 'PLACED' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelOrder}
                    >
                      <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.status === 'DELIVERED' && (
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleCompleteOrder(selectedOrder.orderId)}
                    >
                      <Text style={styles.completeButtonText}>Confirm Delivery & Completed</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff', // Very light blue/gray background
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
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: '#64748b',
      fontSize: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSubHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  vendorNameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  dividerSmall: {
      height: 1,
      backgroundColor: '#f1f5f9',
      marginVertical: 8,
  },
  orderIdSub: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    textTransform: 'capitalize'
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  itemsText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  viewDetailsButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modalClose: {
    fontSize: 22,
    color: '#94a3b8',
    padding: 4,
  },
  modalBody: {
    paddingBottom: 40,
  },
  modalVendorNameTitle: {
      fontSize: 24,
      fontWeight: '800', // Very bold
      color: '#0f172a',
      marginBottom: 8,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalOrderIdSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modalVendorName: {
      fontSize: 16,
      color: '#64748b',
      marginBottom: 20,
      fontWeight: '500',
  },
  infoSection: {
      backgroundColor: '#f8fafc',
      padding: 16,
      borderRadius: 16,
      marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  detailIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 12,
  },
  itemsList: {
      marginBottom: 0,
  },
  itemRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  itemNameModal: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  itemPriceModal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
  },
  totalRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    alignItems: 'center',
  },
  totalLabelModal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  totalValueModal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
     fontSize: 16, 
     fontWeight: '700',
     color: '#dc2626'
  },
  completeButton: {
    backgroundColor: '#dcfce7',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
});
