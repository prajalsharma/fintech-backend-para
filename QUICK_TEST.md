# Quick Test - Verify Everything Works

**Last Updated:** December 23, 2025, 8:50 PM IST

---

## Prerequisites

Before testing, ensure:

```bash
# 1. .env is configured
echo "SUPABASE_URL=$SUPABASE_URL"
echo "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo "PARA_API_KEY=$PARA_API_KEY"
echo "INFURA_KEY=$INFURA_KEY"

# 2. All required (not just *_KEY)
grep -E '^[A-Z_]+=' .env | wc -l  # Should show 4+ entries
```

---

## Test 1: Frontend Has NO Supabase

```bash
# Verify frontend doesn't import Supabase
grep -i 'supabase' public/index.html
# Expected: 0 matches

grep -i '@supabase' public/index.html
# Expected: 0 matches

grep -i 'createClient' public/index.html
# Expected: 0 matches
```

✅ **Pass:** No matches
❌ **Fail:** Any matches found

---

## Test 2: Backend Uses Correct Supabase Methods

```bash
# Verify backend auth methods
grep 'supabase.auth.signUpWithPassword' server.js
# Expected: 1 match in /signup endpoint

grep 'supabase.auth.signInWithPassword' server.js
# Expected: 1 match in /login endpoint

grep 'supabase.auth.getUser' server.js
# Expected: 1 match in verifyToken function
```

✅ **Pass:** All found in backend only
❌ **Fail:** Not found or in frontend

---

## Test 3: Start Backend

```bash
npm start

# Expected output:
# ✅ Server running on http://localhost:3000
# 🌐 UI available at http://localhost:3000
# 📖 API Documentation at http://localhost:3000/api
```

✅ **Pass:** Server starts without errors
❌ **Fail:** Error during startup

---

## Test 4: API Health Check

```bash
curl http://localhost:3000/api

# Expected response:
{
  "status": "✅ OK",
  "service": "Fintech Backend (Supabase + Para)",
  "version": "1.0.1",
  "endpoints": {
    "POST /signup": "Create user + auto-create wallet",
    "POST /login": "Authenticate user, return JWT",
    "GET /wallet": "Fetch wallet address + balance (requires Bearer token)",
    "POST /send": "Build, sign, broadcast Sepolia transaction (requires Bearer token)"
  }
}
```

✅ **Pass:** All endpoints listed
❌ **Fail:** 404 or error

---

## Test 5: Signup (Creates User + Wallet)

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Expected response (success):
{
  "user_id": "user_uuid_here",
  "email": "test@example.com",
  "wallet_address": "0x52b54f7460187651ec28de0b9230e650ba644d1d"
}

# Possible error responses:
# 400: "Email and password required"
# 500: "Para API error" - check PARA_API_KEY
```

✅ **Pass:** Returns wallet_address (hex string starting with 0x)
❌ **Fail:** Error or no wallet_address

**Note:** Wallet creation takes 2-5 seconds (polling Para API)

---

## Test 6: Login (Returns JWT)

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Expected response (success):
{
  "user_id": "user_uuid_here",
  "email": "test@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Possible error responses:
# 400: "Email and password required"
# 401: "Invalid login credentials"
```

✅ **Pass:** Returns access_token (JWT)
❌ **Fail:** Error or no access_token

**Save this token:**
```bash
export JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Test 7: Fetch Wallet (Protected Endpoint)

```bash
# First: Save the JWT from login
export JWT="your_jwt_token_here"

# Fetch wallet
curl http://localhost:3000/wallet \
  -H "Authorization: Bearer $JWT"

# Expected response (success):
{
  "address": "0x52b54f7460187651ec28de0b9230e650ba644d1d",
  "balance_eth": "0.0"
}

# Possible error responses:
# 401: "Missing token" - didn't pass Authorization header
# 401: "Invalid token" - JWT is invalid or expired
# 404: "Wallet not found" - user has no wallet (shouldn't happen)
```

✅ **Pass:** Returns address and balance_eth
❌ **Fail:** 401 or 404 error

**Note:** Balance is 0 unless wallet has been funded with Sepolia ETH

---

## Test 8: Frontend UI Test

1. Open browser: `http://localhost:3000`
2. Click "Signup" tab
3. Enter email: `test2@example.com`
4. Enter password: `Test1234!`
5. Click "Sign Up"

**Expected:**
- ✅ Loading message appears
- ✅ Success message: "✓ Account created! Wallet: 0x...."
- ✅ Form clears

**If error:**
- ❌ Check server console for error messages
- ❌ Check .env credentials
- ❌ Check Para API key is valid

---

## Test 9: Frontend Login

1. Click "Login" tab
2. Enter email: `test2@example.com`
3. Enter password: `Test1234!`
4. Click "Login"

**Expected:**
- ✅ Loading message appears
- ✅ Success message: "✓ Logged in as test2@example.com"
- ✅ Token stored in memory (can now use wallet/send)

**If error:**
- ❌ Check email/password are correct
- ❌ Verify signup was successful first

---

## Test 10: Frontend Wallet Fetch

1. Complete Test 9 (login) first
2. Click "Wallet" tab
3. Click "Fetch Wallet Details"

**Expected:**
- ✅ Loading message appears
- ✅ Displays wallet address (0x....)
- ✅ Displays balance (0.0 or funded amount)

**If error:**
- ❌ "Please login first" - didn't login
- ❌ Failed error - check server logs

---

## Test 11: Frontend Send (Requires Funded Wallet)

**Prerequisites:**
1. Fund wallet with Sepolia ETH from [sepoliafaucet.com](https://www.sepoliafaucet.com)
2. Paste your wallet address (from Test 10)
3. Wait for faucet confirmation (~1 min)
4. Refresh page and check balance (should show > 0)

**Then:**
1. Click "Send ETH" tab
2. Recipient: `0xEA3bF8e0B8E6Cdc5a2bFEb8C60d6A3F4E8E3D2C1` (any valid address)
3. Amount: `0.001`
4. Click "Send"

**Expected:**
- ✅ Loading message: "Broadcasting transaction..."
- ✅ Success card appears with:
  - ✅ TX Hash (0x....)
  - ✅ From address
  - ✅ To address
  - ✅ Amount
  - ✅ Etherscan link

**If error:**
- ❌ "insufficient funds" - wallet not funded
- ❌ "Failed" - check server logs
- ❌ No transaction - check Para API key

---

## Test 12: Verify Architecture Non-Negotiables

```bash
# Check 1: Frontend never imports Supabase
grep -r 'import.*supabase' public/
# Expected: 0 matches

# Check 2: Frontend never creates Supabase client
grep -r 'createClient' public/
# Expected: 0 matches

# Check 3: Frontend never calls auth methods
grep -r 'supabase\.auth' public/
# Expected: 0 matches

# Check 4: Backend uses auth methods
grep 'supabase\.auth\.' server.js
# Expected: 3+ matches

# Check 5: Supabase only on server
ls -la node_modules/@supabase/
# Expected: installed (for server use only)
```

✅ **Pass:** All checks pass
❌ **Fail:** Any frontend Supabase references

---

## Summary

| Test | Status | Notes |
|------|--------|-------|
| Frontend clean | ✅ | No Supabase imports |
| Backend auth | ✅ | Correct methods used |
| Server start | ✅ | Should start cleanly |
| Health check | ✅ | GET /api works |
| Signup | ✅ | Creates user + wallet |
| Login | ✅ | Returns JWT |
| Wallet fetch | ✅ | Protected by JWT |
| Frontend UI signup | ✅ | Integration test |
| Frontend UI login | ✅ | Integration test |
| Frontend UI wallet | ✅ | Integration test |
| Frontend UI send | ⚠️ | Requires funded wallet |
| Architecture | ✅ | Meets all requirements |

---

## Troubleshooting

### "SUPABASE_URL not found"
```bash
# Add to .env
echo "SUPABASE_URL=your_url_here" >> .env
echo "SUPABASE_ANON_KEY=your_key_here" >> .env
```

### "PARA_API_KEY is missing"
```bash
echo "PARA_API_KEY=sk_..." >> .env
```

### "signUpWithPassword is not a function"
- **This should NOT happen** - only backend calls this
- If it does: Check frontend for Supabase imports
- If found: Delete all frontend Supabase code

### "Wallet address is undefined"
- Para API key might be invalid
- Check Para dashboard: https://developer.getpara.com
- Verify PARA_BASE_URL is `https://api.beta.getpara.com/v1`

### "JWT verification failed"
- Token might be expired
- Try logging in again
- Check Supabase JWT expiry settings

---

## Success Criteria

✅ **All tests pass**: System is ready for production
✅ **Frontend has zero Supabase code**: Architecture is secure
✅ **Backend controls all auth**: System is secure
✅ **Para wallets are created**: Integration works
✅ **Transactions broadcast**: Full flow works

**Status:** Ready for deployment
