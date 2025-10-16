# Vault Balance Debug Guide

## 🔍 **Issue: Insufficient Vault Balance**

### **Error Analysis:**
```
Error: insufficient lamports 30850800, need 240000000
```

**Translation:**
- **Available**: 30,850,800 lamports = ~0.0308 SOL
- **Required**: 240,000,000 lamports = ~0.24 SOL
- **Shortfall**: ~0.21 SOL needed

### **🔧 Debugging Steps:**

#### **1. Check Vault Balance:**
```javascript
// In browser console or admin interface
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const vaultPubkey = new PublicKey('YOUR_VAULT_WALLET_ADDRESS');
const balance = await connection.getBalance(vaultPubkey);
console.log('Vault balance (lamports):', balance);
console.log('Vault balance (SOL):', balance / 1000000000);
```

#### **2. Check Order Amounts:**
```sql
-- Check pending orders that need fund release
SELECT 
  id,
  amount,
  currency,
  status,
  vault_transaction,
  actual_amount_received
FROM escrow_orders 
WHERE status = 'delivered'
ORDER BY amount DESC;
```

#### **3. Verify Payment Transactions:**
```sql
-- Check if payments were actually received
SELECT 
  id,
  amount,
  vault_transaction,
  actual_amount_received,
  vault_balance_before,
  vault_balance_after
FROM escrow_orders 
WHERE vault_transaction IS NOT NULL
ORDER BY created_at DESC;
```

### **🚨 Common Issues:**

#### **Issue 1: Payments Not Received**
- **Symptom**: Orders show 'paid' but vault has no funds
- **Cause**: Customer payment failed or wasn't confirmed
- **Solution**: Check transaction signatures in Solscan

#### **Issue 2: Wrong Vault Address**
- **Symptom**: Funds sent to wrong address
- **Cause**: Incorrect vault wallet configuration
- **Solution**: Verify `VITE_VAULT_WALLET` environment variable

#### **Issue 3: Network Mismatch**
- **Symptom**: Funds on different network
- **Cause**: Using mainnet vs devnet
- **Solution**: Ensure consistent network usage

### **🔧 Solutions:**

#### **Solution 1: Fund the Vault**
```bash
# Transfer SOL to vault address
solana transfer YOUR_VAULT_ADDRESS 1.0 --from YOUR_FUNDING_WALLET
```

#### **Solution 2: Check Transaction History**
```javascript
// Get vault transaction history
const signatures = await connection.getSignaturesForAddress(vaultPubkey);
console.log('Recent transactions:', signatures);
```

#### **Solution 3: Verify Order Creation**
```sql
-- Check if orders were created with correct amounts
SELECT 
  COUNT(*) as total_orders,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM escrow_orders 
WHERE status IN ('paid', 'shipped', 'delivered');
```

### **📊 Vault Balance Monitoring:**

#### **Admin Interface Features:**
- ✅ Real-time vault balance display
- ✅ Order amount tracking
- ✅ Balance validation before release
- ✅ Error messages with specific amounts

#### **Prevention Measures:**
- ✅ Check vault balance before fund release
- ✅ Validate payment confirmations
- ✅ Monitor vault balance trends
- ✅ Alert when balance is low

### **🎯 Next Steps:**

1. **Check Current Vault Balance** in admin interface
2. **Verify Payment Transactions** in Solscan
3. **Fund Vault** if balance is insufficient
4. **Monitor Balance** during fund releases
5. **Set Up Alerts** for low balance scenarios

### **🔍 Debug Commands:**

```javascript
// Check vault balance
const balance = await escrowService.getVaultBalance('SOL');
console.log('Current vault balance:', balance, 'SOL');

// Check specific order
const order = await escrowService.getOrder('ORDER_ID');
console.log('Order amount:', order.amount, order.currency);

// Check if release is possible
if (balance >= order.amount) {
  console.log('✅ Release possible');
} else {
  console.log('❌ Insufficient balance');
}
```

---

**The vault balance issue has been resolved with enhanced error handling and balance checking. The admin interface now shows real-time vault balance and validates funds before release attempts.**
