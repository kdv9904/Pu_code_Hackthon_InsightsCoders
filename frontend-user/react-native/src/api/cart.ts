import client from './client';
import { CartResponseDto, AddToCartRequestDto } from '../types/cart';

const getCart = async () => {
    const response = await client.get<CartResponseDto>('/user/cart');
    return response.data;
};

const addToCart = async (productId: string, quantity: number) => {
    const response = await client.post<CartResponseDto>('/user/cart/add', {
        productId,
        quantity
    } as AddToCartRequestDto);
    return response.data;
};

const removeItem = async (itemId: string) => {
    await client.delete(`/user/cart/item/${itemId}`);
};

const clearCart = async () => {
    await client.delete('/user/cart/clear');
};

export default {
    getCart,
    addToCart,
    removeItem,
    clearCart
};
