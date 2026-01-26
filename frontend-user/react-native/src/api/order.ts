import client from './client';
import { OrderResponseDto, PlaceOrderRequestDto } from '../types/order';

const placeOrder = async (details: PlaceOrderRequestDto) => {
    const response = await client.post<OrderResponseDto>('/user/orders/place', details);
    return response.data;
};

const getOrders = async () => {
    const response = await client.get<OrderResponseDto[]>('/user/orders');
    return response.data;
};

const completeOrder = async (orderId: string) => {
    const response = await client.put<{ orderId: string, newStatus: string }>(`/user/orders/${orderId}/complete`);
    return response.data;
};

export default {
    placeOrder,
    getOrders,
    completeOrder
};
