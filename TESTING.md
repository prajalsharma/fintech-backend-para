# Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Server will be available at `http://localhost:3000`

### 3. Run Automated Tests (in another terminal)
```bash
npm test
```

This will run the comprehensive test suite and report results.

---

## What Gets Tested

The automated test suite (`test.js`) validates:

### ✅ Test 1: POST /signup
- Creates a new user via Supabase Auth
- Automatically creates a Para EVM wallet
- Returns `user_id` and `wallet_address`
- **Status**: Should pass ✓

### ✅ Test 2: POST /login
- Authenticates user with email/password
- Returns JWT `access_token`
- Token is valid for subsequent requests
- **Status**: Should pass ✓

### ✅ Test 3: GET /wallet
- Requires Bearer token in Authorization header
- Fetches wallet address from Para
- Queries Sepolia balance via Alchemy RPC
- Returns both `address` and `balance_eth`
- **Status**: Should pass ✓

### ✅ Test 4: POST /send (Conditional)
- Requires Bearer token
- Builds EIP-1559 transaction
- Signs with Para REST API
- Broadcasts to Sepolia testnet
- **Status**: Skipped if wallet balance < 0.01 ETH
- **Note**: Requires funded wallet (use faucet first)

### ✅ Test 5: Authentication Protection
- Verifies that invalid tokens are rejected
- Ensures 401 response for missing/bad auth
- **Status**: Should pass ✓

---

## Expected Test Output

```
════════════════════════════════════════════════════════
  Fintech Backend Integration Tests
════════════════════════════════════════════════════════
Server: http://localhost:3000
Test Email: test-1703349600000@example.com

→ POST /signup - Create user & wallet
✓ User created successfully
✓ Wallet address: 0x1234567890abcdef1234567890abcdef12345678
✓ User ID: 12345678-1234-1234-1234-123456789012

→ POST /login - Authenticate user
✓ Login successful
✓ Token: eyJhbGciOiJIUzI1NiIsInR5...

→ GET /wallet - Fetch wallet address & balance
✓ Wallet fetched successfully
✓ Address: 0x1234567890abcdef1234567890abcdef12345678
✓ Balance: 0.5 ETH

→ POST /send - Send Sepolia ETH (requires funded wallet)
✓ Current balance: 0.5 ETH
✓ Transaction sent successfully
✓ TX Hash: 0x9876543210fedcba9876543210fedcba98765432
✓ From: 0x1234567890abcdef1234567890abcdef12345678
✓ To: 0x742d35Cc6634C0532925a3b844Bc9e7595f42e2e
✓ Amount: 0.001 ETH
✓ View on Sepolia: https://sepolia.etherscan.io/tx/0x9876...

→ GET /wallet - Verify auth protection (invalid token)
✓ Auth protection working correctly

════════════════════════════════════════════════════════
All tests completed!
════════════════════════════════════════════════════════
```

---

## Manual Testing with cURL

### Test Signup
```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "user_id": "abc123...",
  "email": "user@example.com",
  "wallet_address": "0x..."
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**
```json
{
  "user_id": "abc123...",
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test Get Wallet
```bash
curl -X GET http://localhost:3000/wallet \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "address": "0x...",
  "balance_eth": "0.5"
}
```

### Test Send Transaction

**First**, fund your wallet with Sepolia ETH:
1. Get wallet address from `/wallet` endpoint
2. Visit [Sepolia Faucet](https://sepolia-faucet.pk910.de/)
3. Paste address and claim ETH (free, takes ~30 seconds)

**Then**, send a transaction:
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e2e",
    "amount": "0.001"
  }'
```

**Expected Response:**
```json
{
  "transaction_hash": "0x...",
  "from": "0x...",
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e2e",
  "amount": "0.001"
}
```

**View transaction:**
Paste `transaction_hash` into [Sepolia Etherscan](https://sepolia.etherscan.io/)

---

## Testing with Hoppscotch

Prefer GUI? Use [Hoppscotch.io](https://hoppscotch.io/) (free, no signup needed):

1. Open [hoppscotch.io](https://hoppscotch.io/)
2. Create collection: "Fintech Backend Tests"
3. Add requests:

**POST /signup**
```
URL: http://localhost:3000/signup
Method: POST
Headers: Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "Test1234!"
}
```

**POST /login**
```
URL: http://localhost:3000/login
Method: POST
Headers: Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "Test1234!"
}
```

**GET /wallet** (Copy token from login response)
```
URL: http://localhost:3000/wallet
Method: GET
Headers: Authorization: Bearer <your_token_here>
```

**POST /send** (with funded wallet)
```
URL: http://localhost:3000/send
Method: POST
Headers: 
  - Content-Type: application/json
  - Authorization: Bearer <your_token_here>
Body:
{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e2e",
  "amount": "0.001"
}
```

---

## Troubleshooting

### Server won't start
```
Error: Cannot find module 'express'
```
**Fix:** Run `npm install`

### "Supabase error: Missing credentials"
```
Error: Missing or invalid SUPABASE_URL / SUPABASE_ANON_KEY
```
**Fix:** Check `.env` file has correct Supabase credentials

### "Para API error: Invalid API key"
```
Error: Para API error: Invalid API key
```
**Fix:** Verify `PARA_API_KEY` in `.env` is correct and valid

### "Wallet creation timeout"
```
Error: Wallet creation timeout
```
**Fix:** Para wallet initialization took >15 seconds. Try again, may be slow API response.

### "Insufficient balance for test transaction"
```
⚠ Wallet has insufficient balance for test transaction
⚠ Fund wallet with Sepolia ETH from: https://sepolia-faucet.pk910.de/
```
**Fix:** 
1. Get wallet address from `/wallet` endpoint
2. Use [Sepolia Faucet](https://sepolia-faucet.pk910.de/) to get free ETH
3. Wait ~30 seconds for transaction to confirm
4. Try `/send` again

### "Invalid token" / "401 Unauthorized"
```
Error: Invalid token
```
**Fix:** 
- Token may have expired
- Token format should be: `Authorization: Bearer <token>`
- Not: `Authorization: <token>` (missing "Bearer")

### "Cannot GET /wallet" (404)
```
Error: Cannot GET /wallet
```
**Fix:** 
- Make sure server is running (`npm start` in another terminal)
- Check server is on `http://localhost:3000`
- Verify endpoint is `/wallet` (not `/wallets` with 's')

---

## Success Checklist

- [ ] Server starts without errors
- [ ] Signup creates user and wallet
- [ ] Login returns access token
- [ ] `/wallet` returns address and balance
- [ ] Auth protection works (invalid token = 401)
- [ ] Transaction sending works (requires funded wallet)
- [ ] All tests pass with `npm test`

---

## Environment Variables Checklist

Verify all required env vars are set in `.env`:

```bash
# Supabase
SUPABASE_URL=https://fqfncycbhpaivyqymumx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Para API
PARA_API_KEY=beta_af6ef9d045152eaf7207be1430ee5676

# Ethereum RPC (Sepolia via Alchemy)
INFURA_KEY=nwXWbXXntrP8P1jjipZCK

# Server
PORT=3000
```

✅ All set? Run `npm start` and then `npm test`!

---

## Next Steps

1. **Deploy**: Use Vercel, Railway, or Heroku
2. **Persist Data**: Replace in-memory wallet map with PostgreSQL
3. **Add Security**: Rate limiting, input validation, logging
4. **Add Features**: Multiple wallets per user, transaction history, etc.
5. **Production**: Use mainnet instead of Sepolia

---

**Questions?** Check [README.md](./README.md) or [GitHub Issues](https://github.com/prajalsharma/fintech-backend-para/issues)
