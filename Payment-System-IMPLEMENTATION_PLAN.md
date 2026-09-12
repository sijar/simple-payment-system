# Payment System Implementation Plan - Java Spring JDBC

## Phase 1: Project Setup

### 1.1 Dependencies
```
spring-boot-starter-web
spring-boot-starter-jdbc
spring-boot-starter-data-jpa (optional, for migrations)
postgresql (or mysql, h2 for testing)
flyway-core (database migrations)
junit-jupiter, testcontainers
```

### 1.2 Project Structure
```
payment-system/
├── pom.xml
├── src/main/java/com/payment/
│   ├── config/
│   │   ├── DatabaseConfig.java
│   │   └── TransactionConfig.java
│   ├── controller/
│   │   ├── PaymentController.java
│   │   └── AccountController.java
│   ├── service/
│   │   ├── PaymentService.java
│   │   ├── AccountService.java
│   │   └── IdempotencyService.java
│   ├── repository/
│   │   ├── AccountRepository.java
│   │   ├── LedgerRepository.java
│   │   ├── IdempotencyKeyRepository.java
│   │   └── TransactionRepository.java
│   ├── domain/
│   │   ├── Account.java
│   │   ├── LedgerEntry.java
│   │   ├── PaymentRequest.java
│   │   ├── PaymentResponse.java
│   │   └── IdempotencyKey.java
│   ├── exception/
│   │   ├── PaymentException.java
│   │   ├── InsufficientFundsException.java
│   │   └── DuplicateTransactionException.java
│   └── PaymentSystemApplication.java
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/
│       ├── V1__Create_Accounts.sql
│       ├── V2__Create_Ledger.sql
│       └── V3__Create_Idempotency_Keys.sql
└── src/test/java/com/payment/
    ├── service/
    │   ├── PaymentServiceTest.java
    │   └── IdempotencyTest.java
    └── integration/
        └── PaymentIntegrationTest.java
```

---

## Phase 2: Database Schema

### 2.1 Accounts Table
```sql
CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_number ON accounts(account_number);
```

### 2.2 Ledger Table (Source of Truth)
```sql
CREATE TABLE ledger (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    transaction_id VARCHAR(36) NOT NULL UNIQUE,
    amount DECIMAL(19,2) NOT NULL,
    type VARCHAR(10) NOT NULL,  -- DEBIT or CREDIT
    description VARCHAR(255),
    reference_id VARCHAR(100),  -- payment_id, order_id, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT check_amount CHECK (amount > 0),
    CONSTRAINT check_type CHECK (type IN ('DEBIT', 'CREDIT'))
);

CREATE INDEX idx_ledger_account_id ON ledger(account_id);
CREATE INDEX idx_ledger_transaction_id ON ledger(transaction_id);
CREATE INDEX idx_ledger_created_at ON ledger(created_at);
CREATE INDEX idx_ledger_reference ON ledger(reference_id);
```

### 2.3 Idempotency Keys Table
```sql
CREATE TABLE idempotency_keys (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(36) NOT NULL,
    client_id VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64),
    response_status VARCHAR(20),
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    UNIQUE(idempotency_key, client_id),
    CONSTRAINT check_expires CHECK (expires_at > created_at)
);

CREATE INDEX idx_idempotency_key ON idempotency_keys(idempotency_key, client_id);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
```

### 2.4 Transactions Table (For Payment Tracking)
```sql
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(36) UNIQUE NOT NULL,
    from_account_id BIGINT NOT NULL,
    to_account_id BIGINT NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, COMPLETED, FAILED, ROLLED_BACK
    idempotency_key VARCHAR(36),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    FOREIGN KEY (from_account_id) REFERENCES accounts(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id),
    CONSTRAINT check_amount CHECK (amount > 0),
    CONSTRAINT check_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'ROLLED_BACK'))
);

CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
```

---

## Phase 3: Domain Models

### 3.1 Account.java
```java
public class Account {
    private Long id;
    private String accountNumber;
    private String accountHolder;
    private String currency;
    private String status;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // getters, setters, toString
    
    public BigDecimal getBalance(JdbcTemplate jdbc) {
        String sql = "SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE account_id = ?";
        return jdbc.queryForObject(sql, new Object[]{this.id}, BigDecimal.class);
    }
}
```

### 3.2 LedgerEntry.java
```java
public class LedgerEntry {
    private Long id;
    private Long accountId;
    private String transactionId;
    private BigDecimal amount;
    private String type;  // DEBIT or CREDIT
    private String description;
    private String referenceId;
    private LocalDateTime createdAt;
    
    // getters, setters, toString
}
```

### 3.3 PaymentRequest.java
```java
public class PaymentRequest {
    private String idempotencyKey;  // UUID from client
    private String clientId;
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;
    private String description;
    
    // validation, getters, setters
}
```

### 3.4 PaymentResponse.java
```java
public class PaymentResponse {
    private String transactionId;
    private String status;  // SUCCESS, FAILED, DUPLICATE
    private BigDecimal fromBalance;
    private BigDecimal toBalance;
    private LocalDateTime processedAt;
    private String message;
    
    // getters, setters, toString
}
```

### 3.5 IdempotencyKey.java
```java
public class IdempotencyKey {
    private Long id;
    private String key;
    private String clientId;
    private String requestHash;
    private String responseStatus;
    private String responseBody;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    
    // getters, setters
}
```

---

## Phase 4: Repository Layer (JDBC)

### 4.1 AccountRepository.java
```java
@Repository
public class AccountRepository {
    private final JdbcTemplate jdbc;
    
    public AccountRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }
    
    public Account findById(Long id) {
        String sql = "SELECT * FROM accounts WHERE id = ?";
        return jdbc.queryForObject(sql, new Object[]{id}, accountRowMapper());
    }
    
    public Account findByAccountNumber(String accountNumber) {
        String sql = "SELECT * FROM accounts WHERE account_number = ?";
        return jdbc.queryForObject(sql, new Object[]{accountNumber}, accountRowMapper());
    }
    
    public List<Account> findAll() {
        String sql = "SELECT * FROM accounts";
        return jdbc.query(sql, accountRowMapper());
    }
    
    public void save(Account account) {
        String sql = "INSERT INTO accounts (account_number, account_holder, currency, status) " +
                     "VALUES (?, ?, ?, ?)";
        jdbc.update(sql, account.getAccountNumber(), account.getAccountHolder(), 
                    account.getCurrency(), account.getStatus());
    }
    
    public BigDecimal getBalance(Long accountId) {
        String sql = "SELECT COALESCE(SUM(CASE " +
                     "WHEN type = 'CREDIT' THEN amount " +
                     "WHEN type = 'DEBIT' THEN -amount " +
                     "END), 0) FROM ledger WHERE account_id = ?";
        return jdbc.queryForObject(sql, new Object[]{accountId}, BigDecimal.class);
    }
    
    private RowMapper<Account> accountRowMapper() {
        return (rs, rowNum) -> {
            Account account = new Account();
            account.setId(rs.getLong("id"));
            account.setAccountNumber(rs.getString("account_number"));
            account.setAccountHolder(rs.getString("account_holder"));
            account.setCurrency(rs.getString("currency"));
            account.setStatus(rs.getString("status"));
            account.setVersion(rs.getLong("version"));
            account.setCreatedAt(rs.getObject("created_at", LocalDateTime.class));
            account.setUpdatedAt(rs.getObject("updated_at", LocalDateTime.class));
            return account;
        };
    }
}
```

### 4.2 LedgerRepository.java
```java
@Repository
public class LedgerRepository {
    private final JdbcTemplate jdbc;
    
    public LedgerRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }
    
    public void addEntry(LedgerEntry entry) {
        String sql = "INSERT INTO ledger (account_id, transaction_id, amount, type, description, reference_id) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        jdbc.update(sql, entry.getAccountId(), entry.getTransactionId(), entry.getAmount(),
                    entry.getType(), entry.getDescription(), entry.getReferenceId());
    }
    
    public List<LedgerEntry> findByAccountId(Long accountId) {
        String sql = "SELECT * FROM ledger WHERE account_id = ? ORDER BY created_at DESC";
        return jdbc.query(sql, new Object[]{accountId}, ledgerRowMapper());
    }
    
    public BigDecimal calculateBalance(Long accountId) {
        String sql = "SELECT COALESCE(SUM(CASE " +
                     "WHEN type = 'CREDIT' THEN amount " +
                     "WHEN type = 'DEBIT' THEN -amount " +
                     "END), 0) FROM ledger WHERE account_id = ?";
        return jdbc.queryForObject(sql, new Object[]{accountId}, BigDecimal.class);
    }
    
    private RowMapper<LedgerEntry> ledgerRowMapper() {
        return (rs, rowNum) -> {
            LedgerEntry entry = new LedgerEntry();
            entry.setId(rs.getLong("id"));
            entry.setAccountId(rs.getLong("account_id"));
            entry.setTransactionId(rs.getString("transaction_id"));
            entry.setAmount(rs.getBigDecimal("amount"));
            entry.setType(rs.getString("type"));
            entry.setDescription(rs.getString("description"));
            entry.setReferenceId(rs.getString("reference_id"));
            entry.setCreatedAt(rs.getObject("created_at", LocalDateTime.class));
            return entry;
        };
    }
}
```

### 4.3 IdempotencyKeyRepository.java
```java
@Repository
public class IdempotencyKeyRepository {
    private final JdbcTemplate jdbc;
    
    public IdempotencyKeyRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }
    
    public Optional<IdempotencyKey> findByKeyAndClient(String key, String clientId) {
        String sql = "SELECT * FROM idempotency_keys WHERE idempotency_key = ? AND client_id = ?";
        try {
            IdempotencyKey result = jdbc.queryForObject(sql, new Object[]{key, clientId}, 
                                                         idempotencyRowMapper());
            return Optional.of(result);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
    
    public void save(IdempotencyKey key) {
        String sql = "INSERT INTO idempotency_keys (idempotency_key, client_id, request_hash, created_at, expires_at) " +
                     "VALUES (?, ?, ?, ?, ?)";
        jdbc.update(sql, key.getKey(), key.getClientId(), key.getRequestHash(),
                    key.getCreatedAt(), key.getExpiresAt());
    }
    
    public void updateResponse(String key, String clientId, String status, String responseBody) {
        String sql = "UPDATE idempotency_keys SET response_status = ?, response_body = ? " +
                     "WHERE idempotency_key = ? AND client_id = ?";
        jdbc.update(sql, status, responseBody, key, clientId);
    }
    
    private RowMapper<IdempotencyKey> idempotencyRowMapper() {
        return (rs, rowNum) -> {
            IdempotencyKey key = new IdempotencyKey();
            key.setId(rs.getLong("id"));
            key.setKey(rs.getString("idempotency_key"));
            key.setClientId(rs.getString("client_id"));
            key.setRequestHash(rs.getString("request_hash"));
            key.setResponseStatus(rs.getString("response_status"));
            key.setResponseBody(rs.getString("response_body"));
            key.setCreatedAt(rs.getObject("created_at", LocalDateTime.class));
            key.setExpiresAt(rs.getObject("expires_at", LocalDateTime.class));
            return key;
        };
    }
}
```

### 4.4 TransactionRepository.java
```java
@Repository
public class TransactionRepository {
    private final JdbcTemplate jdbc;
    
    public TransactionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }
    
    public void createTransaction(PaymentRequest request, String transactionId) {
        String sql = "INSERT INTO transactions " +
                     "(transaction_id, from_account_id, to_account_id, amount, status, idempotency_key, created_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        jdbc.update(sql, transactionId, request.getFromAccountId(), request.getToAccountId(),
                    request.getAmount(), "PENDING", request.getIdempotencyKey(), LocalDateTime.now());
    }
    
    public void updateStatus(String transactionId, String status) {
        String sql = "UPDATE transactions SET status = ?, completed_at = ? WHERE transaction_id = ?";
        jdbc.update(sql, status, LocalDateTime.now(), transactionId);
    }
    
    public void updateStatusWithReason(String transactionId, String status, String reason) {
        String sql = "UPDATE transactions SET status = ?, failure_reason = ?, completed_at = ? " +
                     "WHERE transaction_id = ?";
        jdbc.update(sql, status, reason, LocalDateTime.now(), transactionId);
    }
    
    private RowMapper<Transaction> transactionRowMapper() {
        return (rs, rowNum) -> {
            Transaction tx = new Transaction();
            tx.setId(rs.getLong("id"));
            tx.setTransactionId(rs.getString("transaction_id"));
            tx.setFromAccountId(rs.getLong("from_account_id"));
            tx.setToAccountId(rs.getLong("to_account_id"));
            tx.setAmount(rs.getBigDecimal("amount"));
            tx.setStatus(rs.getString("status"));
            tx.setIdempotencyKey(rs.getString("idempotency_key"));
            tx.setFailureReason(rs.getString("failure_reason"));
            tx.setCreatedAt(rs.getObject("created_at", LocalDateTime.class));
            tx.setCompletedAt(rs.getObject("completed_at", LocalDateTime.class));
            return tx;
        };
    }
}
```

---

## Phase 5: Service Layer (Transaction Logic)

### 5.1 PaymentService.java
```java
@Service
public class PaymentService {
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);
    
    private final JdbcTemplate jdbc;
    private final AccountRepository accountRepository;
    private final LedgerRepository ledgerRepository;
    private final IdempotencyKeyRepository idempotencyRepository;
    private final TransactionRepository transactionRepository;
    
    public PaymentService(JdbcTemplate jdbc, AccountRepository accountRepository,
                         LedgerRepository ledgerRepository, IdempotencyKeyRepository idempotencyRepository,
                         TransactionRepository transactionRepository) {
        this.jdbc = jdbc;
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.transactionRepository = transactionRepository;
    }
    
    // Core payment processing with idempotency and transaction safety
    @Transactional(
        isolation = Isolation.SERIALIZABLE,
        propagation = Propagation.REQUIRES_NEW,
        rollbackFor = {PaymentException.class, Exception.class},
        timeout = 30
    )
    public PaymentResponse processPayment(PaymentRequest request) {
        String transactionId = UUID.randomUUID().toString();
        
        try {
            // Step 1: Check idempotency
            Optional<IdempotencyKey> cached = idempotencyRepository
                .findByKeyAndClient(request.getIdempotencyKey(), request.getClientId());
            
            if (cached.isPresent() && cached.get().getResponseStatus() != null) {
                logger.info("Returning cached response for idempotency key: {}", request.getIdempotencyKey());
                return deserializeResponse(cached.get().getResponseBody());
            }
            
            // Step 2: Validate accounts exist
            Account fromAccount = accountRepository.findById(request.getFromAccountId());
            Account toAccount = accountRepository.findById(request.getToAccountId());
            
            if (fromAccount == null || toAccount == null) {
                throw new PaymentException("One or both accounts do not exist");
            }
            
            if ("INACTIVE".equals(fromAccount.getStatus())) {
                throw new PaymentException("Source account is inactive");
            }
            
            // Step 3: Create transaction record
            transactionRepository.createTransaction(request, transactionId);
            
            // Step 4: Lock accounts in deterministic order (prevent deadlock)
            lockAccountsInOrder(request.getFromAccountId(), request.getToAccountId());
            
            // Step 5: Validate sufficient funds
            BigDecimal fromBalance = ledgerRepository.calculateBalance(request.getFromAccountId());
            if (fromBalance.compareTo(request.getAmount()) < 0) {
                transactionRepository.updateStatusWithReason(transactionId, "FAILED", 
                    "Insufficient funds. Current balance: " + fromBalance);
                throw new InsufficientFundsException("Insufficient funds");
            }
            
            // Step 6: Record ledger entries (atomic debit + credit)
            LedgerEntry debitEntry = new LedgerEntry();
            debitEntry.setAccountId(request.getFromAccountId());
            debitEntry.setTransactionId(transactionId);
            debitEntry.setAmount(request.getAmount());
            debitEntry.setType("DEBIT");
            debitEntry.setDescription(request.getDescription());
            debitEntry.setReferenceId(transactionId);
            ledgerRepository.addEntry(debitEntry);
            
            LedgerEntry creditEntry = new LedgerEntry();
            creditEntry.setAccountId(request.getToAccountId());
            creditEntry.setTransactionId(transactionId);
            creditEntry.setAmount(request.getAmount());
            creditEntry.setType("CREDIT");
            creditEntry.setDescription(request.getDescription());
            creditEntry.setReferenceId(transactionId);
            ledgerRepository.addEntry(creditEntry);
            
            // Step 7: Update transaction status
            transactionRepository.updateStatus(transactionId, "COMPLETED");
            
            // Step 8: Calculate new balances
            BigDecimal newFromBalance = ledgerRepository.calculateBalance(request.getFromAccountId());
            BigDecimal newToBalance = ledgerRepository.calculateBalance(request.getToAccountId());
            
            // Step 9: Build response
            PaymentResponse response = new PaymentResponse();
            response.setTransactionId(transactionId);
            response.setStatus("SUCCESS");
            response.setFromBalance(newFromBalance);
            response.setToBalance(newToBalance);
            response.setProcessedAt(LocalDateTime.now());
            response.setMessage("Payment processed successfully");
            
            // Step 10: Cache response for idempotency
            idempotencyRepository.save(new IdempotencyKey()
                .setKey(request.getIdempotencyKey())
                .setClientId(request.getClientId())
                .setResponseStatus("SUCCESS")
                .setResponseBody(serializeResponse(response))
                .setCreatedAt(LocalDateTime.now())
                .setExpiresAt(LocalDateTime.now().plusDays(24))
            );
            
            logger.info("Payment processed successfully. Transaction ID: {}", transactionId);
            return response;
            
        } catch (InsufficientFundsException e) {
            logger.warn("Insufficient funds for transaction: {}", transactionId);
            // Already marked as FAILED in transaction table
            throw e;
        } catch (Exception e) {
            logger.error("Payment processing failed: {}", transactionId, e);
            transactionRepository.updateStatusWithReason(transactionId, "FAILED", e.getMessage());
            throw new PaymentException("Payment processing failed: " + e.getMessage(), e);
        }
    }
    
    // Lock accounts in deterministic order to prevent deadlock
    private void lockAccountsInOrder(Long accountId1, Long accountId2) {
        String sql = "SELECT id FROM accounts WHERE id = ? FOR UPDATE";
        
        if (accountId1 < accountId2) {
            jdbc.queryForObject(sql, new Object[]{accountId1}, Long.class);
            jdbc.queryForObject(sql, new Object[]{accountId2}, Long.class);
        } else {
            jdbc.queryForObject(sql, new Object[]{accountId2}, Long.class);
            jdbc.queryForObject(sql, new Object[]{accountId1}, Long.class);
        }
    }
    
    private String serializeResponse(PaymentResponse response) {
        try {
            return new ObjectMapper().writeValueAsString(response);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    
    private PaymentResponse deserializeResponse(String json) {
        try {
            return new ObjectMapper().readValue(json, PaymentResponse.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```

### 5.2 AccountService.java
```java
@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private final LedgerRepository ledgerRepository;
    
    public AccountService(AccountRepository accountRepository, LedgerRepository ledgerRepository) {
        this.accountRepository = accountRepository;
        this.ledgerRepository = ledgerRepository;
    }
    
    public AccountDTO getAccount(Long accountId) {
        Account account = accountRepository.findById(accountId);
        BigDecimal balance = ledgerRepository.calculateBalance(accountId);
        
        return new AccountDTO()
            .setId(account.getId())
            .setAccountNumber(account.getAccountNumber())
            .setAccountHolder(account.getAccountHolder())
            .setBalance(balance)
            .setStatus(account.getStatus());
    }
    
    @Transactional
    public void createAccount(String accountNumber, String accountHolder, String currency) {
        Account account = new Account();
        account.setAccountNumber(accountNumber);
        account.setAccountHolder(accountHolder);
        account.setCurrency(currency);
        account.setStatus("ACTIVE");
        accountRepository.save(account);
    }
    
    public List<LedgerEntryDTO> getTransactionHistory(Long accountId, int limit) {
        List<LedgerEntry> entries = ledgerRepository.findByAccountId(accountId);
        return entries.stream()
            .limit(limit)
            .map(entry -> new LedgerEntryDTO()
                .setTransactionId(entry.getTransactionId())
                .setAmount(entry.getAmount())
                .setType(entry.getType())
                .setDescription(entry.getDescription())
                .setCreatedAt(entry.getCreatedAt())
            )
            .collect(Collectors.toList());
    }
}
```

---

## Phase 6: REST Controller

### 6.1 PaymentController.java
```java
@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    private final PaymentService paymentService;
    
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
    
    @PostMapping("/transfer")
    public ResponseEntity<?> transferFunds(
            @RequestBody PaymentRequest request,
            @RequestHeader(value = "X-Client-ID", required = true) String clientId,
            @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey) {
        
        try {
            request.setClientId(clientId);
            request.setIdempotencyKey(idempotencyKey);
            
            PaymentResponse response = paymentService.processPayment(request);
            logger.info("Payment transferred: {}", request.getIdempotencyKey());
            return ResponseEntity.ok(response);
            
        } catch (InsufficientFundsException e) {
            logger.warn("Insufficient funds: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(Map.of("error", e.getMessage()));
        } catch (PaymentException e) {
            logger.error("Payment failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error"));
        }
    }
    
    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<?> getAccount(@PathVariable Long accountId) {
        try {
            return ResponseEntity.ok(accountService.getAccount(accountId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Account not found"));
        }
    }
    
    @GetMapping("/accounts/{accountId}/history")
    public ResponseEntity<?> getTransactionHistory(
            @PathVariable Long accountId,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            return ResponseEntity.ok(accountService.getTransactionHistory(accountId, limit));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
```

---

## Phase 7: Configuration

### 7.1 DatabaseConfig.java
```java
@Configuration
public class DatabaseConfig {
    
    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

### 7.2 application.properties
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/payment_system
spring.datasource.username=postgres
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver

# JDBC Connection Pool (HikariCP)
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.idle-timeout=300000

# Transaction Configuration
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Flyway (Database Migrations)
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# Logging
logging.level.com.payment=DEBUG
logging.level.org.springframework.jdbc=DEBUG

# Server Configuration
server.port=8080
server.servlet.context-path=/
```

---

## Phase 8: Exception Handling

### 8.1 Exception Classes
```java
public class PaymentException extends RuntimeException {
    public PaymentException(String message) {
        super(message);
    }
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
}

public class InsufficientFundsException extends PaymentException {
    public InsufficientFundsException(String message) {
        super(message);
    }
}

public class DuplicateTransactionException extends PaymentException {
    public DuplicateTransactionException(String message) {
        super(message);
    }
}
```

### 8.2 Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<?> handleInsufficientFunds(InsufficientFundsException e) {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
            .body(Map.of("error", e.getMessage(), "code", "INSUFFICIENT_FUNDS"));
    }
    
    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<?> handlePaymentException(PaymentException e) {
        logger.error("Payment exception: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", e.getMessage(), "code", "PAYMENT_ERROR"));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneralException(Exception e) {
        logger.error("Unexpected error: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Internal server error", "code", "INTERNAL_ERROR"));
    }
}
```

---

## Phase 9: Testing Strategy

### 9.1 Unit Tests - PaymentServiceTest.java
- ✅ Test successful payment transfer
- ✅ Test insufficient funds scenario
- ✅ Test idempotent retry (same key = same result)
- ✅ Test concurrent payments (thread-safe)
- ✅ Test balance calculation accuracy
- ✅ Test ledger entries created correctly

### 9.2 Integration Tests - PaymentIntegrationTest.java
```java
@SpringBootTest
@TestcontainersTest
public class PaymentIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("payment_test")
        .withUsername("test")
        .withPassword("test");
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private LedgerRepository ledgerRepository;
    
    @Test
    public void testSuccessfulPayment() {
        // Setup: Create two accounts with initial funds
        // Execute: Transfer funds
        // Assert: Ledger entries created, balance updated
    }
    
    @Test
    public void testIdempotentRetry() {
        // Setup: Create payment with idempotency key
        // Execute: Process same payment twice
        // Assert: Both return same response, only one ledger entry
    }
    
    @Test
    public void testConcurrentPayments() {
        // Setup: Create multiple threads making concurrent payments
        // Execute: All threads transfer simultaneously
        // Assert: No race conditions, all balances correct
    }
    
    @Test
    public void testDeadlockPrevention() {
        // Setup: Create scenario that could cause deadlock
        // Execute: Payments in different order simultaneously
        // Assert: All complete without deadlock
    }
    
    @Test
    public void testInsufficientFunds() {
        // Setup: Account with limited balance
        // Execute: Try to transfer more than available
        // Assert: Transaction fails, balance unchanged
    }
}
```

### 9.3 Concurrency/Stress Tests
```java
@Test
public void testConcurrentTransactions() throws InterruptedException {
    int threadCount = 10;
    ExecutorService executor = Executors.newFixedThreadPool(threadCount);
    CountDownLatch latch = new CountDownLatch(threadCount);
    
    for (int i = 0; i < threadCount; i++) {
        executor.submit(() -> {
            PaymentRequest request = new PaymentRequest();
            request.setFromAccountId(1L);
            request.setToAccountId(2L);
            request.setAmount(BigDecimal.TEN);
            request.setIdempotencyKey(UUID.randomUUID().toString());
            
            paymentService.processPayment(request);
            latch.countDown();
        });
    }
    
    latch.await();
    executor.shutdown();
    
    // Verify balances are consistent
}
```

---

## Phase 10: Build & Deployment

### 10.1 Maven pom.xml Structure
```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.payment</groupId>
    <artifactId>payment-system</artifactId>
    <version>1.0.0</version>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.0</version>
    </parent>
    
    <dependencies>
        <!-- Spring Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring JDBC -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        
        <!-- PostgreSQL Driver -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <version>42.6.0</version>
        </dependency>
        
        <!-- Flyway (Migrations) -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        
        <!-- Jackson (JSON) -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        
        <!-- Logging -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        
        <!-- Testcontainers -->
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers</artifactId>
            <version>1.18.0</version>
            <scope>test</scope>
        </dependency>
        
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <version>1.18.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 10.2 Build & Run Commands
```bash
# Build
mvn clean package

# Run Tests
mvn test

# Run Application
mvn spring-boot:run

# Build Docker Image
docker build -t payment-system:1.0.0 .
```

---

## Phase 11: Key Implementation Details

### 11.1 Why JDBC over JPA?
- ✅ Full control over SQL execution
- ✅ Explicit transaction management
- ✅ Better for complex payment logic
- ✅ Easier to debug and understand
- ✅ No ORM overhead

### 11.2 Idempotency Strategy
- Client generates UUID and sends with every payment
- Server caches response in `idempotency_keys` table
- Same key within 24 hours returns cached response
- Prevents duplicate processing on retries

### 11.3 Ledger Design
- Never update account balance directly
- All transactions recorded as ledger entries
- Balance = SUM(CREDIT) - SUM(DEBIT)
- Provides complete audit trail
- Supports balance reconciliation

### 11.4 Transaction Safety
- SERIALIZABLE isolation prevents dirty/phantom reads
- Account locking in deterministic order prevents deadlocks
- REQUIRES_NEW ensures each payment is independent transaction
- Rollback on any exception maintains consistency

### 11.5 Concurrency Control
```
Lock Order (prevents deadlock):
1. Always lock account with lower ID first
2. Then lock account with higher ID
3. Prevents circular wait conditions
```

---

## Phase 12: Monitoring & Debugging

### 12.1 Logging Strategy
```java
// Use different log levels:
logger.debug("Detailed execution flow");
logger.info("Business events (successful payment)");
logger.warn("Expected errors (insufficient funds)");
logger.error("Unexpected failures", exception);
```

### 12.2 Metrics to Track
- Payment success rate
- Average payment processing time
- Idempotency cache hit rate
- Deadlock occurrences
- Concurrent transaction conflicts

---

## Implementation Roadmap

1. **Week 1**: Database schema + migrations
2. **Week 2**: Repository layer (JDBC)
3. **Week 3**: Service layer + transactions
4. **Week 4**: REST API + exception handling
5. **Week 5**: Unit + integration tests
6. **Week 6**: Performance testing + tuning
7. **Week 7**: Documentation + deployment
