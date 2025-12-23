# Para REST API Compatibility Report

**Date:** December 23, 2025, 8:45 PM IST
**Status:** ❌ **INCOMPATIBLE - Multiple API Implementation Bugs**

---

## Executive Summary

Your backend implementation has **4 critical bugs** that don't match the Para REST API specification:

1. ❌ **Wrong Base URL** - Using `v2` instead of `v1`
2. ❌ **Wrong Wallet Creation Payload** - Missing required `userIdentifier` and `userIdentifierType`
3. ❌ **Wrong Sign Endpoint** - Using `message` instead of `data`
4. ❌ **Wrong API Structure** - Not following Para's documented pattern

**Result:** Your API calls will fail with the actual Para service.

---

## Bug #1: Wrong Base URL

### Current Code ❌
```javascript
const PARA_BASE_URL = 'https://api.getpara.com/v2';
```

### Para Documentation 📖
```
Environment         Base URL
────────────────────────────────────────────
BETA                https://api.beta.getpara.com
PRODUCTION          https://api.getpara.com

All endpoints are versioned under /v1
```

### Correct Fix ✅
```javascript
const PARA_BASE_URL = 'https://api.getpara.com/v1';  // v1, not v2
```

---

## Bug #2: Wrong Wallet Creation Payload

### Current Code ❌
```javascript
async function createParaWallet(userId) {
  const res = await paraRequest('POST', '/wallets', {
    chain: 'evm',           // ❌ WRONG FIELD
    environment: PARA_ENV,  // ❌ WRONG FIELD
  });
}
```

### Para Documentation 📖
```
POST /v1/wallets

Required Body Fields:
  ✓ type: "EVM" | "SOLANA" | "COSMOS"
  ✓ userIdentifier: string (email, phone, or partner-supplied id)
  ✓ userIdentifierType: "EMAIL" | "PHONE" | "CUSTOM_ID" | "GUEST_ID" | "TELEGRAM" | "DISCORD" | "TWITTER"

Optional Fields:
  - scheme: "DKLS" | "CGGMP" | "ED25519" (defaults to DKLS for EVM)
  - cosmosPrefix: string (for COSMOS only)

Example:
{
  "type": "EVM",
  "userIdentifier": "alice@example.com",
  "userIdentifierType": "EMAIL"
}
```

### Correct Fix ✅
```javascript
async function createParaWallet(userId, email) {
  const res = await paraRequest('POST', '/wallets', {
    type: 'EVM',                    // ✓ CORRECT FIELD
    userIdentifier: email,          // ✓ Use email from user
    userIdentifierType: 'EMAIL',    // ✓ Email type
  });
}
```

---

## Bug #3: Wrong Sign Endpoint Payload

### Current Code ❌
```javascript
const signRes = await paraRequest('POST', `/wallets/${walletId}/sign-raw`, {
  message: txHash,  // ❌ WRONG FIELD NAME
});
```

### Para Documentation 📖
```
POST /v1/wallets/:walletId/sign-raw

Required Body:
{
  "data": "0xdeadbeef"  // ✓ Must be hex string with 0x prefix
}

Example:
curl -X POST https://api.beta.getpara.com/v1/wallets/wallet_123/sign-raw \
  -H "X-API-Key: sk_..." \
  -H "Content-Type: application/json" \
  -d '{"data": "0xdeadbeef"}'

Response:
{
  "signature": "0x..."
}
```

### Correct Fix ✅
```javascript
const signRes = await paraRequest('POST', `/wallets/${walletId}/sign-raw`, {
  data: txHash,  // ✓ CORRECT FIELD NAME
});
```

---

## Bug #4: Incorrect Transaction Hashing

### Current Code ❌
```javascript
const unsignedTx = ethers.Transaction.from(tx);
const txHash = unsignedTx.unsignedHash;  // ❌ This is wrong

const signRes = await paraRequest('POST', `/wallets/${walletId}/sign-raw`, {
  message: txHash,  // ❌ Wrong field and wrong value
});
```

### Para Documentation 📖 (From TypeScript Example)
```typescript
// From Para docs: Sign and Send a Sepolia Transaction

const unsignedSerialized = Transaction.from(unsignedTx).unsignedSerialized;
const digest = keccak256(unsignedSerialized);  // ✓ Use digest, not unsignedHash

const res = await fetch(`${PARA_BASE_URL}/v1/wallets/${PARA_WALLET_ID}/sign-raw`, {
  method: "POST",
  headers: {
    "X-API-Key": PARA_API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ data: digest })  // ✓ Use 'data' field
});

const { signature } = await res.json();
const rawTx = serializeTransaction(unsignedTx, Signature.from(signature));
```

### Correct Fix ✅
```javascript
const { keccak256 } = ethers;  // Import keccak256

// Build transaction
const tx = {
  chainId: CHAIN_ID,
  nonce,
  to,
  value: ethers.parseEther(amount),
  gasLimit: 21000,
  maxFeePerGas: feeData.maxFeePerGas,
  maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  data: '0x',  // Add data field
};

// Get digest
const unsignedTx = ethers.Transaction.from(tx);
const unsignedSerialized = unsignedTx.unsignedSerialized;  // ✓ Get serialized
const digest = keccak256(unsignedSerialized);  // ✓ Hash it

// Sign
const signRes = await paraRequest('POST', `/wallets/${walletId}/sign-raw`, {
  data: digest,  // ✓ Use 'data' field with digest
});

// Serialize with signature
const signature = ethers.Signature.from(signRes.signature);
const rawTx = ethers.serializeTransaction(unsignedTx, signature);
```

---

## Summary Table

| Issue | Current | Documented | Fix |
|-------|---------|------------|-----|
| Base URL | `https://api.getpara.com/v2` | `https://api.getpara.com/v1` | Change `v2` → `v1` |
| Create Wallet Body | `{chain, environment}` | `{type, userIdentifier, userIdentifierType}` | Use documented fields |
| Sign Endpoint | `/sign-raw` with `message` | `/sign-raw` with `data` | Change field name |
| Hash Method | `unsignedHash` | `keccak256(unsignedSerialized)` | Use correct digest |
| Result | ❌ API calls fail | ✅ Correct | Fix all 4 bugs |

---

## Para API Endpoints (Actual)

Based on documentation:

### Create Wallet ✅
```
POST /v1/wallets

Body:
{
  "type": "EVM",
  "userIdentifier": "user@example.com",
  "userIdentifierType": "EMAIL"
}

Response:
{
  "wallet": {
    "id": "wallet_123",
    "type": "EVM",
    "status": "creating",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "scheme": "DKLS"
}
```

### Get Wallet ✅
```
GET /v1/wallets/:walletId

Response:
{
  "id": "wallet_123",
  "type": "EVM",
  "status": "ready",
  "address": "0x52b54f7460187651ec28de0b9230e650ba644d1d",
  "publicKey": "0x04c3f0b85a...",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Sign Raw Bytes ✅
```
POST /v1/wallets/:walletId/sign-raw

Body:
{
  "data": "0xdeadbeef"
}

Response:
{
  "signature": "0x..."
}
```

---

## Error Codes (From Documentation)

```
400 Bad Request        - missing/invalid fields
401 Unauthorized       - invalid API key or calling IP not allowlisted
404 Not Found          - wallet not found for this partner
409 Conflict           - duplicate type + scheme + userIdentifier combination
500 Internal Error     - server error
```

---

## Production vs Beta

### Your Current Code
```javascript
const PARA_BASE_URL = 'https://api.getpara.com/v2';
const PARA_ENV = 'BETA';
```

### What It Should Be
```javascript
// For BETA (testing)
const PARA_BASE_URL = 'https://api.beta.getpara.com/v1';

// For PRODUCTION (live)
const PARA_BASE_URL = 'https://api.getpara.com/v1';
```

---

## Authentication (Correct Implementation)

Your auth headers are correct:

```javascript
const headers = {
  'X-API-Key': PARA_API_KEY,           // ✓ Correct
  'Content-Type': 'application/json',  // ✓ Correct
  // Optional:
  // 'X-Request-Id': uuid()  // For tracing
};
```

---

## Key Differences

| Aspect | Your Code | Documentation |
|--------|-----------|----------------|
| Base URL | `v2` endpoint (doesn't exist) | `v1` endpoint |
| Wallet Creation | Wrong payload | Clear spec |
| User Identifier | Not used | Required |
| Signing | `message` field | `data` field |
| Hash Method | `unsignedHash` | `keccak256(unsignedSerialized)` |
| Response Handling | Assumes structure | Different structure |

---

## Impact

**Current State:**
- ❌ Wallet creation will fail (wrong payload)
- ❌ Signing will fail (wrong field name)
- ❌ Transactions cannot be broadcast
- ❌ System non-functional with actual Para API

**After Fixes:**
- ✅ Wallet creation works
- ✅ Signing works
- ✅ Transactions broadcast correctly
- ✅ System works with actual Para API

---

## Recommendations

1. **Immediate:** Fix all 4 bugs in `server.js`
2. **Testing:** Use Para's BETA environment first
3. **Validation:** Test each endpoint independently
4. **Production:** Switch to production URL once verified
5. **Documentation:** Update comments to match Para API

---

## References

- Para REST API Docs: https://docs.getpara.com/v2/rest/overview
- Setup Guide: https://docs.getpara.com/v2/rest/setup
- Endpoints: https://docs.getpara.com/v2/rest/references/endpoints
- Example (TypeScript): Para docs → "Sign and Send a Sepolia Transaction"
