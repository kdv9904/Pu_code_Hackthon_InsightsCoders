import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VerificationStatus = 'PENDING' | 'APPROVED' | null;

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  token: string | null;
  verificationStatus: VerificationStatus;
  userRoles: string[]; // Added userRoles
  setIsLoggedIn: (v: boolean) => void;
  setToken: (t: string | null) => void;
  setVerificationStatus: (v: VerificationStatus) => void;
  setUserRoles: (roles: string[]) => void; // Added setter
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]); // Init empty

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const status = await AsyncStorage.getItem('verificationStatus');
        const rolesString = await AsyncStorage.getItem('userRoles'); // Read roles

        if (storedToken) {
          setToken(storedToken);
          setVerificationStatus(status as VerificationStatus);
          
          if (rolesString) {
            try {
              const roles = JSON.parse(rolesString);
              setUserRoles(roles);
            } catch (e) {
              console.log('Error parsing roles', e);
            }
          }
          
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    await AsyncStorage.clear();
    setIsLoggedIn(false);
    setToken(null);
    setVerificationStatus(null);
    setUserRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        token,
        verificationStatus,
        userRoles,
        setIsLoggedIn,
        setToken,
        setVerificationStatus,
        setUserRoles,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
