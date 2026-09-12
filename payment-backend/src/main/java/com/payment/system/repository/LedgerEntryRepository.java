package com.payment.system.repository;

import com.payment.system.model.Account;
import com.payment.system.model.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    @Query("select coalesce(sum(case when le.type = 'CREDIT' then le.amount else -le.amount end), 0) from LedgerEntry le where le.account.id = :accountId")
    BigDecimal calculateBalance(@Param("accountId") Long accountId);

    @Query("select le from LedgerEntry le where le.account.id = :accountId order by le.createdAt desc")
    List<LedgerEntry> findByAccountIdOrderByCreatedAtDesc(@Param("accountId") Long accountId);

    @Query("select le from LedgerEntry le where le.account = :account order by le.createdAt desc")
    List<LedgerEntry> findByAccountOrderByCreatedAtDesc(@Param("account") Account account);
}
