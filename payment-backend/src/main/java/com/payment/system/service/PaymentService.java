package com.payment.system.service;

import com.payment.system.dto.AccountDTO;
import com.payment.system.dto.LedgerEntryDTO;
import com.payment.system.dto.PaymentRequest;
import com.payment.system.dto.PaymentResponse;
import com.payment.system.model.Account;
import com.payment.system.model.LedgerEntry;
import com.payment.system.repository.AccountRepository;
import com.payment.system.repository.LedgerEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    public PaymentService(AccountRepository accountRepository, LedgerEntryRepository ledgerEntryRepository) {
        this.accountRepository = accountRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    public List<AccountDTO> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::toAccountDto)
                .collect(Collectors.toList());
    }

    public AccountDTO getAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        AccountDTO dto = toAccountDto(account);
        dto.setBalance(ledgerEntryRepository.calculateBalance(accountId));
        return dto;
    }

    public List<LedgerEntryDTO> getTransactionHistory(Long accountId, int limit) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        return ledgerEntryRepository.findByAccountOrderByCreatedAtDesc(account)
                .stream()
                .limit(limit)
                .map(this::toLedgerEntryDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        if (request.getFromAccountId() == null || request.getToAccountId() == null) {
            throw new IllegalArgumentException("Source and destination accounts are required");
        }
        if (request.getFromAccountId().equals(request.getToAccountId())) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        Account fromAccount = accountRepository.findById(request.getFromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        Account toAccount = accountRepository.findById(request.getToAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!"ACTIVE".equalsIgnoreCase(fromAccount.getStatus())) {
            throw new IllegalArgumentException("Source account is inactive");
        }

        BigDecimal fromBalance = ledgerEntryRepository.calculateBalance(fromAccount.getId());
        if (fromBalance.compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient funds");
        }

        String transactionId = "TXN-" + UUID.randomUUID();
        String description = request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription()
                : "Transfer to " + toAccount.getAccountNumber();

        LedgerEntry debit = new LedgerEntry();
        debit.setAccount(fromAccount);
        debit.setTransactionId(transactionId);
        debit.setAmount(request.getAmount());
        debit.setType("DEBIT");
        debit.setDescription(description);
        debit.setReferenceId(transactionId);
        debit.setCreatedAt(Instant.now());

        LedgerEntry credit = new LedgerEntry();
        credit.setAccount(toAccount);
        credit.setTransactionId(transactionId);
        credit.setAmount(request.getAmount());
        credit.setType("CREDIT");
        credit.setDescription(description);
        credit.setReferenceId(transactionId);
        credit.setCreatedAt(Instant.now());

        ledgerEntryRepository.save(debit);
        ledgerEntryRepository.save(credit);

        PaymentResponse response = new PaymentResponse();
        response.setTransactionId(transactionId);
        response.setStatus("SUCCESS");
        response.setFromBalance(ledgerEntryRepository.calculateBalance(fromAccount.getId()));
        response.setToBalance(ledgerEntryRepository.calculateBalance(toAccount.getId()));
        response.setProcessedAt(Instant.now());
        response.setMessage("Payment processed successfully");
        return response;
    }

    private AccountDTO toAccountDto(Account account) {
        AccountDTO dto = new AccountDTO();
        dto.setId(account.getId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setAccountHolder(account.getAccountHolder());
        dto.setBalance(ledgerEntryRepository.calculateBalance(account.getId()));
        dto.setStatus(account.getStatus());
        return dto;
    }

    private LedgerEntryDTO toLedgerEntryDto(LedgerEntry entry) {
        LedgerEntryDTO dto = new LedgerEntryDTO();
        dto.setTransactionId(entry.getTransactionId());
        dto.setAmount(entry.getAmount());
        dto.setType(entry.getType());
        dto.setDescription(entry.getDescription());
        dto.setCreatedAt(entry.getCreatedAt());
        return dto;
    }
}
