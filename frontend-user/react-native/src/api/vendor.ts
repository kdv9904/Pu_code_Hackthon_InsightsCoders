import client from './client';
import { NearbyVendorResponse, VendorResponseDto, Category, Product, ProductImageResponseDto, VendorCatalogResponse } from '../types/vendor';

const getNearbyVendors = async (lat: number, lng: number, radiusKm: number = 5) => {
  const response = await client.get<NearbyVendorResponse[]>('/vendors/nearby', {
    params: { lat, lng, radiusKm },
  });
  return response.data;
};

const getNearbyVendorsByCategory = async (lat: number, lng: number, category: string, radiusKm: number = 5) => {
    const response = await client.get<NearbyVendorResponse[]>('/vendors/nearby/category', {
        params: { lat, lng, category, radiusKm }
    });
    return response.data;
};

const getVendorById = async (vendorId: string) => {
    const response = await client.get<VendorResponseDto>(`/vendor/${vendorId}`);
    return response.data;
};

const getVendorCategories = async (vendorId: string) => {
    const response = await client.get<Category[]>(`/vendor/categories/${vendorId}`);
    return response.data;
};

const getAllCategories = async (isActive: boolean = true) => {
    const response = await client.get<{ content: Category[] }>('/vendor/categories', {
        params: { isActive, pageable: { page: 0, size: 20 } } // Default pagination
    });
    return response.data.content;
};

const getVendorProducts = async (vendorId: string) => {
    const response = await client.get<Product[]>(`/vendor/products/${vendorId}`);
    return response.data;
};

const getProductsByCategory = async (categoryId: string) => {
    const response = await client.get<Product[]>(`/vendor/products/${categoryId}`);
    return response.data;
};

const getProductImages = async (productId: string) => {
    const response = await client.get<ProductImageResponseDto[]>(`/vendor/products/${productId}/images`);
    return response.data;
}

const getVendorCatalog = async (vendorId: string) => {
    // User specified: /api/v1/users/vendors/{{vendorId}}/catalog
    const response = await client.get<VendorCatalogResponse>(`/users/vendors/${vendorId}/catalog`);
    return response.data;
};

export default {
  getNearbyVendors,
  getNearbyVendorsByCategory,
  getAllCategories,
  getVendorById,
  getVendorCategories,
  getVendorProducts,
  getProductsByCategory,
  getProductImages,
  getVendorCatalog
};
