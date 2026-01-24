package org.pucodehackathon.backend.order.controller;


import lombok.RequiredArgsConstructor;
import org.pucodehackathon.backend.helper.UserPrincipal;
import org.pucodehackathon.backend.order.dto.order.*;
import org.pucodehackathon.backend.order.service.OrderService;
import org.pucodehackathon.backend.order.service.UserOrderService;
import org.pucodehackathon.backend.order.service.VendorOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
public class VendorOrderController {

    private final VendorOrderService vendorOrderService;
    private final UserOrderService userOrderService;

    @GetMapping
    public ResponseEntity<List<OrderResponseDto>> getOrders(Authentication auth) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return ResponseEntity.ok(
                vendorOrderService.getVendorOrders(principal.getUser().getId())
        );
    }

    @PutMapping("/{orderId}/accept")
    public ResponseEntity<VendorOrderActionResponseDto> acceptOrder(
            Authentication auth,
            @PathVariable UUID orderId
    ) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return ResponseEntity.ok(
                vendorOrderService.acceptOrder(principal.getUser().getId(), orderId)
        );
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDetailsResponseDto> getOrderDetails(
            Authentication authentication,
            @PathVariable UUID orderId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
                userOrderService.getOrderDetails(
                        principal.getUser().getId(),
                        orderId
                )
        );
    }

    @PutMapping("/{orderId}/reject")
    public ResponseEntity<VendorOrderActionResponseDto> rejectOrder(
            Authentication auth,
            @PathVariable UUID orderId,
            @RequestBody RejectOrderRequestDto request
    ) {
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return ResponseEntity.ok(
                vendorOrderService.rejectOrder(
                        principal.getUser().getId(),
                        orderId,
                        request.getReason()
                )
        );
    }
}
