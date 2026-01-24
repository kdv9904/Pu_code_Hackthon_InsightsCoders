package org.pucodehackathon.backend.order.service.impl;

import lombok.RequiredArgsConstructor;
import org.pucodehackathon.backend.auth.model.User;
import org.pucodehackathon.backend.order.dto.order.*;
import org.pucodehackathon.backend.order.model.Order;
import org.pucodehackathon.backend.order.model.OrderStatus;
import org.pucodehackathon.backend.order.repository.OrderRepository;
import org.pucodehackathon.backend.order.service.UserOrderLifecycleService;
import org.pucodehackathon.backend.order.service.UserOrderService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserOrderServiceImpl implements UserOrderService {

    private final OrderRepository orderRepository;
    private final org.pucodehackathon.backend.auth.repositories.UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public OrderDetailsResponseDto getOrderDetails(UUID userId, UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Authorization check
        boolean isCustomer = order.getUser().getId().equals(userId);
        boolean isVendor = order.getVendor().getUserId().equals(userId);

        if (!isCustomer && !isVendor) {
            throw new AccessDeniedException("Unauthorized access to order");
        }

        // Fetch vendor user (owner of vendor)
        User vendorUser = userRepository.findById(order.getVendor().getUserId())
                .orElse(null);

        VendorSummaryDto vendor = VendorSummaryDto.builder()
                .vendorId(order.getVendor().getVendorId())
                .businessName(order.getVendor().getBusinessName())
                .phone(vendorUser != null ? vendorUser.getPhoneNumber() : null)
                .build();

        // Customer phone fallback logic
        String customerPhone = order.getUser().getPhoneNumber();

        UserAddressDto address = UserAddressDto.builder()
                .addressLine(order.getDeliveryAddress())
                .phone(
                        order.getDeliveryPhone() != null
                                ? order.getDeliveryPhone()
                                : customerPhone
                )
                .build();

        List<OrderItemDto> items = order.getItems().stream()
                .map(item -> OrderItemDto.builder()
                        .productId(item.getProduct().getProductId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .total(
                                item.getPrice()
                                        .multiply(BigDecimal.valueOf(item.getQuantity()))
                        )
                        .build())
                .toList();

        return OrderDetailsResponseDto.builder()
                .orderId(order.getOrderId())
                .status(order.getStatus().name())
                .vendor(vendor)
                .deliveryAddress(address)
                .items(items)
                .totalAmount(order.getTotalAmount())
                .paymentMethod(
                        order.getPaymentMethod() != null
                                ? order.getPaymentMethod().name()
                                : null
                )
                .createdAt(order.getCreatedAt())
                .acceptedAt(order.getAcceptedAt())
                .outForDeliveryAt(order.getOutForDeliveryAt())
                .deliveredAt(order.getDeliveredAt())
                .completedAt(order.getCompletedAt())
                .build();
    }

}
