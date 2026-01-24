export interface CartItemDto {
  cartItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface CartResponseDto {
  cartId: string;
  vendorId: string;
  vendorName: string;
  items: CartItemDto[];
  totalAmount: number;
}

export interface AddToCartRequestDto {
  productId: string;
  quantity: number;
}
