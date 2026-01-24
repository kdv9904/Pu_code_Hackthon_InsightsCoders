import client from './client';
import {
  AuthResponse,
  LoginPayload,
  SignupPayload,
  ForgotPasswordPayload,
  VerifyOtpPayload,
  ResetPasswordPayload,
} from '../types/auth';

const login = async (payload: LoginPayload) => {
  const response = await client.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

const register = async (payload: SignupPayload) => {
  // Correct endpoint for User Signup based on existing code
  const response = await client.post<AuthResponse>('/auth/signup', payload);
  return response.data;
};

const forgotPassword = async (payload: ForgotPasswordPayload) => {
  const response = await client.post<AuthResponse>('/auth/forgot-password', payload);
  return response.data;
};

const verifyOtp = async (payload: VerifyOtpPayload) => {
  const response = await client.post<AuthResponse>('/auth/verify-otp', payload);
  return response.data;
};

const resendOtp = async (email: string) => {
  const response = await client.post<AuthResponse>(`/auth/resend-otp/${encodeURIComponent(email)}`);
  return response.data;
};

const resetPassword = async (payload: ResetPasswordPayload) => {
  const response = await client.post<AuthResponse>('/auth/reset-password', payload);
  return response.data;
};

export default {
  login,
  register,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
};
