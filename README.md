# Fintech Backend: Supabase Auth + Para REST API

A minimal but working backend for crypto wallet management using Supabase for authentication and Para REST API for wallet operations on Sepolia testnet.

## 🚀 Quick Links

- **[Testing Guide](./TESTING.md)** - How to test the backend locally
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to Vercel with environment variables
- **[GitHub Repo](https://github.com/prajalsharma/fintech-backend-para)** - Source code

## Architecture

```
Client
  ↓
Express Server
  ├─ Supabase Auth (signup/login)
  ├─ Para REST API (wallet creation/signing)
  └─ ethers v6 (RPC interactions)
  ↓
Sepolia Testnet
```

## Core Features

- **Sign Up**: Register with email/password → automatically creates Para EVM wallet
- **Login**: Authenticate with Supabase → get JWT token
- **View Wallet**: Fetch wallet address + Sepolia ETH balance
- **Send Transaction**: Build, sign with Para, and broadcast Sepolia ETH

## API Routes

### POST /signup
Create a new user and wallet.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "wallet_address": "0x..."
}
```

### POST /login
Authenticate user and return JWT.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "access_token": "jwt_token"
}
```

### GET /wallet
Fetch authenticated user's wallet address and balance.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "address": "0x...",
  "balance_eth": "1.5"
}
```

### POST /send
Build, sign, and broadcast a Sepolia transaction.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "to": "0x...",
  "amount": "0.1"
}
```

**Response:**
```json
{
  "transaction_hash": "0x...",
  "from": "0x...",
  "to": "0x...",
  "amount": "0.1"
}
```

## Setup

### 1. Prerequisites

- Node.js v18+
- Supabase account (free tier works)
- Para API key (sign up at [getpara.com](https://getpara.com))
- Alchemy API key for Sepolia RPC

### 2. Clone & Install

```bash
git clone https://github.com/prajalsharma/fintech-backend-para.git
cd fintech-backend-para
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required env vars:**
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PARA_API_KEY`: Your Para REST API key
- `INFURA_KEY`: Your Alchemy API key for Sepolia
- `PORT`: (optional, defaults to 3000)

### 4. Run

```bash
npm start
```

Server starts on `http://localhost:3000`.

**Development mode with auto-reload:**
```bash
npm run dev
```

## Testing the API

Use Hoppscotch, Postman, or curl. See [TESTING.md](./TESTING.md) for detailed examples.

### Quick Test

```bash
# Signup
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Run automated tests
npm test
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import `fintech-backend-para` repository
4. Add 4 environment variables (see [DEPLOYMENT.md](./DEPLOYMENT.md))
5. Deploy!

**Environment Variables for Vercel:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PARA_API_KEY` (SECRET)
- `INFURA_KEY` (SECRET)

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## How It Works

### Signup Flow
1. User registers with email/password
2. Supabase creates user account
3. Backend calls Para `POST /wallets` with `chain: 'evm'`
4. Backend polls wallet status until `ready`
5. Wallet address is returned to client

### Send Transaction Flow
1. Build EIP-1559 transaction with ethers v6
2. Hash unsigned transaction
3. Call Para `POST /wallets/{id}/sign-raw` with txHash
4. Para returns signature
5. Attach signature to transaction and serialize
6. Broadcast to Sepolia RPC

### Storage

**Current:** In-memory mapping of Supabase user ID → Para wallet ID

**Production:** Replace with database (PostgreSQL, MongoDB, etc.)

```javascript
// Current (in-memory)
const walletMap = {}; // supabase_user_id -> para_wallet_id

// Suggested: Use Supabase profiles table
const { data } = await supabase
  .from('profiles')
  .select('para_wallet_id')
  .eq('user_id', userId)
  .single();
```

## Key Design Decisions

1. **Minimal Dependencies**: Only express, ethers, supabase auth, dotenv
2. **Single Wallet Per User**: One wallet created on signup, reused for all transactions
3. **Server-Side Secrets**: Para API key never sent to client
4. **Polling for Wallet Ready**: Para wallets take ~1-2 seconds to initialize
5. **In-Memory Storage**: Works for MVP; replace with persistent DB for production
6. **Sepolia Testnet**: Use faucets for testing ETH

## Troubleshooting

### "Para API error: Invalid API key"
Check `PARA_API_KEY` in `.env`

### "Wallet creation timeout"
Wallet may be in slow initialization. Increase timeout or check Para dashboard.

### "Invalid token"
Token expired or malformed. Re-login to get fresh token.

### Transaction broadcast fails
Likely insufficient gas or wrong RPC. Check Sepolia status and wallet balance.

## References

- [Para REST Docs](https://docs.getpara.com/v2/rest/overview)
- [Para Wallets](https://docs.getpara.com/v2/rest/guides/wallets)
- [Para Signing](https://docs.getpara.com/v2/rest/guides/signing)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [ethers v6](https://docs.ethers.org/v6/)

## License

MIT
