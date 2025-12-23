# Fintech Backend: Supabase Auth + Para REST API

A minimal but working backend for crypto wallet management using Supabase for authentication and Para REST API for wallet operations on Sepolia testnet. Includes a built-in test UI for easy interaction.

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/prajalsharma/fintech-backend-para.git
cd fintech-backend-para
npm install

# Set up environment (fill in your credentials)
cp .env.example .env

# Start server with frontend UI
npm start

# Open http://localhost:3000 in your browser
```

## 🔗 Quick Links

- **[Frontend Guide](./FRONTEND.md)** - Using the built-in test UI
- **[API Testing Guide](./TESTING.md)** - Testing endpoints with curl/Hoppscotch
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to Vercel

## 📦 What's Included

✅ **Backend API** - Express.js with 4 core endpoints
✅ **Frontend UI** - Vanilla HTML + JS (no dependencies)
✅ **Supabase Auth** - Email/password authentication
✅ **Para Wallets** - Auto-create EVM wallet on signup
✅ **Sepolia Transactions** - Sign and broadcast transactions
✅ **Testing Suite** - Automated endpoint tests

## 🎯 Core Features

### Signup
- Email + password → user account + Para wallet
- Wallet address returned immediately

### Login
- Email + password → JWT token
- Token required for wallet operations

### View Wallet
- Display wallet address
- Show Sepolia ETH balance (updated in real-time)

### Send Transaction
- Recipient address + amount → broadcast transaction
- Signs with Para, broadcasts to Sepolia
- Returns transaction hash for verification

## 🏗️ Architecture

```
┌─────────────────────────┐
│   Frontend (HTML + JS)  │
│   http://localhost:3000 │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────┐
│  Express.js Backend     │
│  /signup /login         │
│  /wallet /send          │
└────────┬──────────┬─────┘
         │          │
    ┌────▼──┐   ┌──▼────────┐
    │        │   │           │
  Supabase Para Alchemy RPC
    Auth   Wallets (Sepolia)
```

## 📚 API Routes

### POST /signup
Create user + wallet

**Request:**
```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'
```

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "wallet_address": "0x1234567890abcdef..."
}
```

### POST /login
Authenticate user

**Request:**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'
```

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /wallet
Fetch wallet + balance (requires auth)

**Request:**
```bash
curl -X GET http://localhost:3000/wallet \
  -H "Authorization: Bearer <access_token>"
```

**Response:**
```json
{
  "address": "0x1234567890abcdef...",
  "balance_eth": "1.5"
}
```

### POST /send
Broadcast transaction (requires auth + funds)

**Request:**
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"to":"0x1234567890abcdef...","amount":"0.1"}'
```

**Response:**
```json
{
  "transaction_hash": "0xabcd1234...",
  "from": "0x1234567890abcdef...",
  "to": "0x1234567890abcdef...",
  "amount": "0.1"
}
```

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- [Supabase](https://supabase.com) account (free)
- [Para API](https://getpara.com) key (free tier available)
- [Alchemy](https://www.alchemy.com) API key for Sepolia RPC

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Supabase (from your project settings)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Para API (from https://getpara.com)
PARA_API_KEY=your_para_api_key_here

# Alchemy (from https://www.alchemy.com)
INFURA_KEY=your_alchemy_key_here

# Server port (optional)
PORT=3000
```

### Install & Run

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (with auto-reload)
npm run dev

# Run tests
node test.js
```

## 🧪 Testing

### Using the Frontend UI

1. Open http://localhost:3000
2. Switch between tabs: Signup, Login, Wallet, Send
3. Follow the flow:
   - Signup → get wallet address
   - Login → store JWT token
   - Fetch Wallet → see balance
   - Fund from faucet → get Sepolia ETH
   - Send → broadcast transaction

### Using API Directly

See [TESTING.md](./TESTING.md) for detailed curl/Hoppscotch examples.

### Automated Tests

```bash
node test.js
```

Runs through signup → login → wallet → send flow with real API calls.

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select `fintech-backend-para`
4. Add 4 environment variables
5. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

## 📁 File Structure

```
fintech-backend-para/
├── public/
│   └── index.html           ← Frontend UI (served automatically)
├── server.js                ← Express backend (updated with static serving)
├── test.js                  ← Automated tests
├── package.json
├── .env                     ← Your environment variables
├── .env.example             ← Template
├── README.md                ← This file
├── FRONTEND.md              ← Frontend guide
├── TESTING.md               ← API testing guide
├── DEPLOYMENT.md            ← Deployment instructions
└── TROUBLESHOOTING.md       ← Common issues
```

## 🔑 How It Works

### Signup Flow

```
User fills form
    ↓
Frontend: POST /signup (email, password)
    ↓
Backend: Create Supabase user
    ↓
Backend: Call Para API to create wallet
    ↓
Backend: Poll wallet until ready
    ↓
Backend: Return wallet address
    ↓
Frontend: Show success + wallet address
```

### Send Transaction Flow

```
User enters recipient + amount
    ↓
Frontend: POST /send (to, amount, Bearer token)
    ↓
Backend: Verify JWT token
    ↓
Backend: Build EIP-1559 transaction
    ↓
Backend: Call Para to sign transaction
    ↓
Backend: Broadcast signed transaction to Sepolia
    ↓
Backend: Return transaction hash
    ↓
Frontend: Show tx hash + Etherscan link
```

## 💾 Storage

**Current:** In-memory wallet mapping (dev/testing only)

**Production:** Use database to persist wallet IDs:

```javascript
// Example: Supabase profiles table
const { data } = await supabase
  .from('profiles')
  .select('para_wallet_id')
  .eq('user_id', userId)
  .single();
```

## 🤔 Design Decisions

1. **Minimal Frontend**: HTML + vanilla JS = zero build step, easy to modify
2. **One Wallet Per User**: Simpler than managing multiple wallets
3. **Server-Side Secrets**: Para key never exposed to client
4. **Polling for Wallet**: Para wallets need ~1-2 seconds to initialize
5. **Sepolia Testnet**: Perfect for development and testing
6. **EIP-1559 Transactions**: Modern gas pricing for better UX

## 🐛 Troubleshooting

### Frontend won't load
- Check server is running: `http://localhost:3000`
- Check console (F12) for errors
- Verify port 3000 is free or change PORT in .env

### Signup fails
- Check Supabase credentials in .env
- Verify PARA_API_KEY is correct
- Check server logs for Para error message

### Transaction broadcast fails
- Insufficient balance? Use Sepolia faucet
- Wrong address format? Must start with 0x
- Gas too low? Backend handles gas automatically

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more issues.

## 📖 References

- [Para REST API Docs](https://docs.getpara.com/v2/rest)
- [Para Wallets Guide](https://docs.getpara.com/v2/rest/guides/wallets)
- [Para Signing Guide](https://docs.getpara.com/v2/rest/guides/signing)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [Sepolia Faucet](https://www.sepoliafaucet.com)
- [Sepolia Explorer](https://sepolia.etherscan.io)

## 📝 License

MIT

---

**Built with ❤️ using Supabase, Para, and ethers.js**
