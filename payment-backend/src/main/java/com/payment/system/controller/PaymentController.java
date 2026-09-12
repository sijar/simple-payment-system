package com.payment.system.controller;

import com.payment.system.dto.AccountDTO;
import com.payment.system.dto.LedgerEntryDTO;
import com.payment.system.dto.PaymentRequest;
import com.payment.system.dto.PaymentResponse;
import com.payment.system.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Payments", description = "Payment and account APIs")
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Operation(summary = "Get all accounts")
    @GetMapping("/accounts")
    public List<AccountDTO> getAllAccounts() {
        return paymentService.getAllAccounts();
    }

    @Operation(summary = "Get a single account")
    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<?> getAccount(@PathVariable Long accountId) {
        try {
            return ResponseEntity.ok(paymentService.getAccount(accountId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Operation(summary = "Get account transaction history")
    @GetMapping("/accounts/{accountId}/history")
    public List<LedgerEntryDTO> getTransactionHistory(
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "50") int limit) {
        return paymentService.getTransactionHistory(accountId, limit);
    }

    @Operation(summary = "Transfer funds between accounts")
    @PostMapping("/payments/transfer")
    public ResponseEntity<?> transferFunds(
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader(value = "X-Client-ID", required = false, defaultValue = "web-client") String clientId,
            @RequestHeader(value = "Idempotency-Key", required = false, defaultValue = "") String idempotencyKey) {
        try {
            request.setClientId(clientId);
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                request.setIdempotencyKey(idempotencyKey);
            }
            PaymentResponse response = paymentService.processPayment(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Insufficient funds")) {
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                        .body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
