export interface OrderItemDto {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export interface OrderResponseDto {
    orderId: string;
    vendorId: string;
    vendorName: string;
    status: 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED';
    totalAmount: number;
    societyName: string;
    houseNumber: string;
    phoneNumber: string;
    items: OrderItemDto[];
}

export interface PlaceOrderRequestDto {
    societyName: string;
    houseNumber: string;
    phoneNumber: string;
}
