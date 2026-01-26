export interface AuthResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Updated based on SignupScreen.tsx
export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  image: string; // URL or base64 string
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otpCode: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}
