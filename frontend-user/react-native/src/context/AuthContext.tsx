import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  userId: string;
  sub: string;
  email: string;
  roles: { authority: string }[] | string[];
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserPayload | null;
  setIsLoggedIn: (value: boolean) => void;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserPayload | null>(null);

  const decodeAndSetUser = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      // Map standard claims to our UserPayload if needed
      // Assuming 'sub' is the userId if not explicitly present
      const userPayload: UserPayload = {
        userId: decoded.userId || decoded.sub || '',
        sub: decoded.sub || '',
        email: decoded.email || decoded.sub || '', // fallback
        roles: decoded.roles || []
      };
      setUser(userPayload);
    } catch (error) {
      console.log('Error decoding token:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          decodeAndSetUser(token);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async (token: string) => {
    try {
      await AsyncStorage.setItem('accessToken', token);
      decodeAndSetUser(token);
      setIsLoggedIn(true);
    } catch (error) {
      console.log('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, isLoading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
