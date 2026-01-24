import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, View, ActivityIndicator } from 'react-native';

import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';
import RegisterStack from './src/navigation/RegisterStack';
import WaitingStack from './src/navigation/WaitingStack';

import { AuthProvider, useAuth } from './src/context/AuthContext';

function RootNavigator() {
  const { isLoggedIn, verificationStatus, isLoading, userRoles } = useAuth();

  if (isLoading) {
    // Basic Splash/Loading Screen
    return (
      <React.Fragment>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </React.Fragment>
    );
  }

  if (!isLoggedIn) return <AuthStack />;

  // 1. If PENDING, show Waiting Screen regardless of roles (they might not have the role yet locally)
  if (verificationStatus === 'PENDING') return <WaitingStack />;

  // 2. If NO VENDOR ROLE -> Force Register Flow
  const hasVendorRole = userRoles?.includes('ROLE_VENDOR');
  if (!hasVendorRole) {
    return <RegisterStack />;
  }

  // 3. APPROVED & VENDOR -> Home
  return <AppStack />; 
}


export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
