import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SHADOWS, SPACING, FONTS } from '../constants/theme';
import { AppStackParamList } from '../navigation/AppStack';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface BottomNavigationProps {
  currentRoute?: string;
}

export default function BottomNavigation({ currentRoute }: BottomNavigationProps) {
  const navigation = useNavigation<NavigationProp>();
  
  // Get current route name
  const state = useNavigationState(state => state);
  const activeRouteName = state ? state.routes[state.index].name : (currentRoute || 'Home');

  const navItems = [
    { route: 'Home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
    { route: 'Orders', icon: 'list-outline', activeIcon: 'list', label: 'Orders' }, // Maps to OrderFlow/UserAccount logic
    { route: 'UserAccount', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
  ];

  const handlePress = (route: string) => {
    if (route === 'Orders') {
      // Logic for Orders tab - seemingly mapped to specific screen or UserAccount
      // For now, keeping existing logic but maybe direct to OrderFlow if that's the intention
      navigation.navigate('OrderFlow', { vendorId: 0, vendorName: 'Me' }); 
    } else if (route === 'UserAccount' || route === 'Home') {
      navigation.navigate(route as any);
    }
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeRouteName === item.route || 
          (item.route === 'Orders' && activeRouteName === 'OrderFlow'); // Update active logic
        
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => handlePress(item.route)}
          >
            <View style={[styles.iconContainer, isActive && styles.iconActiveContainer]}>
              <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={24}
                color={isActive ? COLORS.primary : COLORS.subText}
              />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...SHADOWS.strong,
    borderTopWidth: 0, // removed default border
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  iconActiveContainer: {
    backgroundColor: COLORS.primaryLight,
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: COLORS.subText,
    marginTop: 2,
  },
  labelActive: {
    color: COLORS.primary,
  },
});

