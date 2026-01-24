export interface NearbyVendorResponse {
  vendorId: string;
  businessName: string;
  vendorType: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface VendorResponseDto {
    vendorId: string;
    userId: string;
    businessName: string;
    vendorType: 'FIXED' | 'MOBILE';
    verificationStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
    isActive: boolean;
    ratingAvg: number;
    totalReviews: number;
}

export interface Category {
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  category?: Category;
  vendor?: VendorResponseDto;
}

export interface ProductImageResponseDto {
    imageId: string;
    imageUrl: string; // This might be a relative path or full URL, need to check
    isPrimary: boolean;
}

export interface CatalogProduct {
    productId: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    isAvailable: boolean;
    // Helper to link back to category/vendor if needed after flattening
    categoryName?: string;
}

export interface CatalogCategory {
    categoryId: string;
    categoryName: string;
    products: CatalogProduct[];
}

export interface VendorCatalogResponse {
    vendor: {
        vendorId: string;
        businessName: string;
        vendorType: 'FIXED' | 'MOBILE';
        rating: number;
    };
    categories: CatalogCategory[];
}
