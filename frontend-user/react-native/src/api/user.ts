import client from './client';

export interface UserProfileDto {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  image: string;
  provider: string;
  roles: { id: string; roleName: string }[];
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  image?: string;
}

const getUser = async (userId: string) => {
  const response = await client.get<UserProfileDto>(`/users/${userId}`);
  return response.data;
};

const updateUser = async (userId: string, data: UpdateUserDto) => {
  const response = await client.put<UserProfileDto>(`/users/${userId}`, data);
  return response.data;
};

export default {
  getUser,
  updateUser,
};
