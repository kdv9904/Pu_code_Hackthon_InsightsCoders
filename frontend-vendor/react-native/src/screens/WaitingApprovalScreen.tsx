import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SHADOWS, SPACING } from '../constants/theme';

export default function WaitingApprovalScreen({ navigation }: any) {
  const { setVerificationStatus, setIsLoggedIn, setUserRoles } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkApproval = async () => {
    setChecking(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const res = await api.get(`/users/${userId}`);
      const userData = res.data;

      const roles = userData.roles?.map((r: any) => r.roleName) || [];
      const isApproved = roles.includes('ROLE_VENDOR') || userData.enabled; 

      if (isApproved) {
        // 🔄 Sync Roles Locally
        await AsyncStorage.setItem('userRoles', JSON.stringify(roles)); 
        await AsyncStorage.setItem('verificationStatus', 'APPROVED');
        
        // 🔄 Update Context
        // @ts-ignore
        if(setUserRoles) setUserRoles(roles); 
        setVerificationStatus('APPROVED');
      }
    } catch (err) {
      console.log('Approval check error', err);
    } finally {
      setTimeout(() => setChecking(false), 1000);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkApproval, 10000); // Auto-check every 10s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setVerificationStatus(null);
    setIsLoggedIn(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Waiting for Approval</Text>
        
        <Text style={styles.description}>
          Thank you for applying to be a Vendor partner. Our team is currently reviewing your business details.
        </Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>CURRENT STATUS</Text>
          <Text style={styles.statusValue}>Pending Approval</Text>
        </View>

        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={checkApproval}
          disabled={checking}
        >
          {checking ? (
            <Text style={styles.refreshText}>Checking...</Text>
          ) : (
            <>
              <Ionicons name="refresh" size={18} color={COLORS.white} />
              <Text style={styles.refreshText}>Refresh Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out and come back later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  statusBox: {
    width: '100%',
    backgroundColor: '#fff7ed', // Light orange
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: SPACING.m,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9a3412', // Dark orange
    marginBottom: 4,
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c2410c', // Orange
  },
  refreshBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.l,
    ...SHADOWS.light,
  },
  refreshText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutBtn: {
    padding: SPACING.s,
  },
  logoutText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

