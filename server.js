import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Para REST API configuration
// Based on: https://docs.getpara.com/v2/rest/overview
const PARA_API_KEY = process.env.PARA_API_KEY;
const PARA_BASE_URL = 'https://api.beta.getpara.com/v1'; // ✓ FIXED: v1, not v2 + beta endpoint

// Sepolia RPC - use full Alchemy URL
const RPC_URL = `https://eth-sepolia.g.alchemy.com/v2/${process.env.INFURA_KEY}`;
const CHAIN_ID = 11155111;

// Storage: in-memory wallet mapping (replace with DB in production)
const walletMap = {}; // supabase_user_id -> para_wallet_id

// ============= HELPERS =============

async function paraRequest(method, endpoint, body = null) {
  const url = `${PARA_BASE_URL}${endpoint}`;
  const headers = {
    'X-API-Key': PARA_API_KEY,
    'Content-Type': 'application/json',
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Para API error (${res.status}): ${data.message || res.statusText}`);
  }
  return data;
}

async function createParaWallet(userId, email) {
  // ✓ FIXED: Use correct Para API payload
  // POST /v1/wallets with type, userIdentifier, userIdentifierType
  // Ref: https://docs.getpara.com/v2/rest/guides/wallets
  const res = await paraRequest('POST', '/wallets', {
    type: 'EVM',                    // ✓ Correct field (was: chain)
    userIdentifier: email,          // ✓ Required: user's email
    userIdentifierType: 'EMAIL',    // ✓ Required: identifier type
    // scheme defaults to DKLS for EVM (optional)
  });

  const walletId = res.wallet.id;  // ✓ Response structure: res.wallet.id, not res.id

  // Poll until ready (max 30 seconds)
  let wallet = res.wallet;
  let attempts = 0;
  const MAX_ATTEMPTS = 60;

  while (wallet.status !== 'ready' && attempts < MAX_ATTEMPTS) {
    await new Promise((r) => setTimeout(r, 500));
    const getRes = await paraRequest('GET', `/wallets/${walletId}`);
    wallet = getRes;  // ✓ GET response is wallet object directly
    attempts++;
  }

  if (wallet.status !== 'ready') {
    throw new Error(`Wallet creation timeout (status: ${wallet.status})`);
  }

  // Store mapping
  walletMap[userId] = walletId;
  return walletId;
}

async function getWalletAddress(walletId) {
  const wallet = await paraRequest('GET', `/wallets/${walletId}`);
  return wallet.address;  // ✓ Response has address when ready
}

async function getWalletBalance(address) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// Verify Supabase JWT
async function verifyToken(token) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch (err) {
    return null;
  }
}

// ============= ROUTES =============

// Health check / API info
app.get('/api', (req, res) => {
  res.json({
    status: '✅ OK',
    service: 'Fintech Backend (Supabase + Para)',
    version: '1.0.1',
    endpoints: {
      'POST /signup': 'Create user + auto-create wallet',
      'POST /login': 'Authenticate user, return JWT',
      'GET /wallet': 'Fetch wallet address + balance (requires Bearer token)',
      'POST /send': 'Build, sign, broadcast Sepolia transaction (requires Bearer token)',
    },
    ui: 'Open browser to http://localhost:3000 to use the frontend',
    docs: 'https://github.com/prajalsharma/fintech-backend-para',
    para_api_docs: 'https://docs.getpara.com/v2/rest/overview',
    timestamp: new Date().toISOString(),
  });
});

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signUpWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const userId = data.user.id;

    // ✓ FIXED: Pass email to createParaWallet (needed for userIdentifier)
    const walletId = await createParaWallet(userId, email);
    const address = await getWalletAddress(walletId);

    res.json({
      user_id: userId,
      email: data.user.email,
      wallet_address: address,
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      user_id: data.user.id,
      email: data.user.email,
      access_token: data.session.access_token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/wallet', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const walletId = walletMap[userId];
    if (!walletId) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const address = await getWalletAddress(walletId);
    const balance = await getWalletBalance(address);

    res.json({
      address,
      balance_eth: balance,
    });
  } catch (err) {
    console.error('Wallet fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/send', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { to, amount } = req.body;
    if (!to || !amount) {
      return res.status(400).json({ error: 'to and amount required' });
    }

    const walletId = walletMap[userId];
    if (!walletId) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Build Sepolia transaction
    // ✓ FIXED: Follow Para's documented pattern
    // Ref: https://docs.getpara.com/v2/rest/guides/signing
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const fromAddress = await getWalletAddress(walletId);
    const nonce = await provider.getTransactionCount(fromAddress);
    const feeData = await provider.getFeeData();

    const tx = {
      chainId: CHAIN_ID,
      nonce,
      to,
      value: ethers.parseEther(amount),
      gasLimit: 21000,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      data: '0x',  // ✓ Added data field
    };

    // ✓ FIXED: Get digest correctly for signing
    // Use keccak256(unsignedSerialized) as Per docs
    const unsignedTx = ethers.Transaction.from(tx);
    const unsignedSerialized = unsignedTx.unsignedSerialized;  // ✓ Correct: unsignedSerialized
    const digest = ethers.keccak256(unsignedSerialized);  // ✓ Correct: Hash the serialized TX

    // ✓ FIXED: Use 'data' field, not 'message'
    const signRes = await paraRequest('POST', `/wallets/${walletId}/sign-raw`, {
      data: digest,  // ✓ Correct field name (was: message)
    });

    // ✓ FIXED: Extract signature correctly and serialize
    const signature = ethers.Signature.from(signRes.signature);
    const serialized = ethers.serializeTransaction(unsignedTx, signature);

    // Broadcast
    const txRes = await provider.broadcastTransaction(serialized);

    res.json({
      transaction_hash: txRes.hash,
      from: fromAddress,
      to,
      amount,
    });
  } catch (err) {
    console.error('Send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 404 handler for API (JSON)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
    hint: 'Check available endpoints at GET /api',
  });
});

// ============= SERVER =============

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 UI available at http://localhost:${PORT}`);
  console.log(`📖 API Documentation at http://localhost:${PORT}/api`);
  console.log(`📚 Para API Docs: https://docs.getpara.com/v2/rest/overview\n`);
});
