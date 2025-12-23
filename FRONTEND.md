# Frontend Guide

A minimal, single-page HTML frontend has been added to test the Para blockchain backend.

## Quick Start

```bash
# Install dependencies (if not done)
npm install

# Start the server with frontend
npm start

# Open browser to http://localhost:3000
```

## Frontend Features

### 1. Signup
- Create a new account with email + password
- Automatically receives a Para wallet on Sepolia testnet
- Displays the wallet address on success

### 2. Login
- Sign in with email + password
- Stores JWT token in memory
- Token is used for subsequent wallet/send operations

### 3. View Wallet
- Fetch wallet address and current Sepolia ETH balance
- Displays wallet address and balance in read-only format
- Requires valid JWT token

### 4. Send Crypto
- Form to send Sepolia ETH to another address
- Input: recipient address + amount (in ETH)
- Returns transaction hash and full transaction details
- Requires valid JWT token and funds in wallet

## Architecture

```
Fintech Backend (Para)
├── Frontend: public/index.html (vanilla JS)
├── Backend: server.js (Express + Supabase + Para)
├── API Endpoints:
│   ├── POST /signup (email, password) → wallet_address
│   ├── POST /login (email, password) → access_token
│   ├── GET /wallet (Bearer token) → address, balance
│   └── POST /send (Bearer token, to, amount) → tx_hash
└── Blockchain: Sepolia testnet via Alchemy RPC
```

## Flow: How It Tests Para

### Signup Flow
```
1. User enters email + password
2. Frontend → POST /signup (email, password)
3. Backend:
   - Creates Supabase user account
   - Calls Para API: POST /wallets (creates EVM wallet)
   - Polls wallet status until "ready"
   - Stores wallet ID in memory map
4. Backend returns wallet address to frontend
5. Frontend displays success message + wallet address
```

### Login Flow
```
1. User enters email + password
2. Frontend → POST /login (email, password)
3. Backend:
   - Authenticates with Supabase
   - Returns JWT token
4. Frontend stores JWT in memory
5. All subsequent requests include: Authorization: Bearer {JWT}
```

### Wallet Fetch Flow
```
1. User clicks "Fetch Wallet Details"
2. Frontend → GET /wallet (Bearer token)
3. Backend:
   - Verifies JWT token
   - Retrieves wallet from Para: GET /wallets/{walletId}
   - Gets wallet address from Para response
   - Queries Sepolia balance via Alchemy RPC
4. Backend returns address + balance
5. Frontend displays both values
```

### Send Flow
```
1. User enters recipient address + amount
2. Frontend → POST /send (Bearer token, to, amount)
3. Backend:
   - Verifies JWT token
   - Queries Sepolia RPC for nonce, gas prices
   - Builds unsigned transaction object
   - Calls Para API: POST /wallets/{walletId}/sign-raw (signing)
   - Para signs the transaction with wallet's private key
   - Backend serializes signed transaction
   - Broadcasts to Sepolia RPC via ethers.js
4. Backend returns transaction hash
5. Frontend displays tx hash + Etherscan link
```

## Testing Checklist

- [ ] **Server starts** with both frontend and API
- [ ] **Frontend loads** at http://localhost:3000
- [ ] **Signup works** → creates wallet
- [ ] **Login works** → stores JWT
- [ ] **Fetch wallet works** → displays address + 0 balance
- [ ] **Fund wallet** → use Sepolia faucet
- [ ] **Fetch wallet again** → balance updated
- [ ] **Send transaction** → displays TX hash
- [ ] **Verify on Etherscan** → see transaction on sepolia.etherscan.io

## Troubleshooting

### "Please login first" error
- The frontend stores JWT in memory only (not persisted)
- You must login before using wallet or send features
- Refresh the page and login again if needed

### "Wallet not found" error
- Your Para wallet mapping may have been lost (in-memory storage)
- Sign up again or restart the server
- In production, use a database to persist wallet mappings

### Transaction fails with "insufficient funds"
- Your wallet has 0 balance
- Get Sepolia ETH from: https://www.sepoliafaucet.com
- Wait a few minutes and check balance again

### Slow transaction broadcast
- Sepolia can be congested
- Transactions typically confirm within 10-30 seconds
- Check Etherscan: https://sepolia.etherscan.io

## Technology Stack

**Frontend:**
- HTML5
- Vanilla JavaScript (ES6+)
- Fetch API for HTTP requests
- No frameworks or dependencies

**Backend:**
- Express.js (Node.js)
- Supabase Auth (JWT)
- Para REST API (wallet + signing)
- ethers.js (RPC provider)
- Alchemy (Sepolia RPC)

**Blockchain:**
- Ethereum Sepolia testnet
- Para wallets (EVM-compatible)

## File Structure

```
fintech-backend-para/
├── public/
│   └── index.html          ← Frontend UI (served automatically)
├── server.js               ← Express server (updated with static serving)
├── package.json
├── .env
├── FRONTEND.md             ← This file
├── TESTING.md              ← API testing guide
├── DEPLOYMENT.md           ← Deployment instructions
└── README.md               ← Main documentation
```

## Running Tests

The backend includes an automated test suite:

```bash
node test.js
```

This tests:
- Signup endpoint
- Login endpoint
- Wallet fetch (requires valid JWT)
- Send transaction (requires valid JWT)

## Next Steps

For production:

1. **Persist wallet mappings** in a database (PostgreSQL, MongoDB, etc.)
2. **Add authentication** (implement refresh token flow)
3. **Improve frontend** (React, Tailwind CSS, form validation)
4. **Add error boundaries** and comprehensive logging
5. **Test with real Para wallets** in production environment
6. **Implement rate limiting** on API endpoints
7. **Add HTTPS** and secure header middleware
8. **Deploy to cloud** (Vercel, Heroku, AWS, GCP, etc.)

## References

- [Para Documentation](https://docs.getpara.com)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [ethers.js Documentation](https://docs.ethers.org)
- [Sepolia Testnet Faucet](https://www.sepoliafaucet.com)
- [Sepolia Explorer](https://sepolia.etherscan.io)
