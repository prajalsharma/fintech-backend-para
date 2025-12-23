import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const app = express();
app.use(express.json());

// Lazy-load Supabase client only when needed
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error(
        `Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel environment variables.`
      );
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

// Para REST API configuration
const PARA_API_KEY = process.env.PARA_API_KEY;
const PARA_BASE_URL = 'https://api.beta.getpara.com/v1';

// Sepolia RPC
const RPC_URL = `https://eth-sepolia.g.alchemy.com/v2/${process.env.INFURA_KEY}`;
const CHAIN_ID = 11155111;

// Storage: in-memory wallet mapping (reset on each invocation)
const walletMap = {};

// ============= HELPERS =============

async function paraRequest(method, endpoint, body = null) {
  if (!PARA_API_KEY) {
    throw new Error('PARA_API_KEY not set in environment');
  }

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
  const res = await paraRequest('POST', '/wallets', {
    type: 'EVM',
    userIdentifier: email,
    userIdentifierType: 'EMAIL',
  });

  const walletId = res.wallet.id;

  // Poll until ready
  let wallet = res.wallet;
  let attempts = 0;
  const MAX_ATTEMPTS = 60;

  while (wallet.status !== 'ready' && attempts < MAX_ATTEMPTS) {
    await new Promise((r) => setTimeout(r, 500));
    const getRes = await paraRequest('GET', `/wallets/${walletId}`);
    wallet = getRes;
    attempts++;
  }

  if (wallet.status !== 'ready') {
    throw new Error(`Wallet creation timeout (status: ${wallet.status})`);
  }

  walletMap[userId] = walletId;
  return walletId;
}

async function getWalletAddress(walletId) {
  const wallet = await paraRequest('GET', `/wallets/${walletId}`);
  return wallet.address;
}

async function getWalletBalance(address) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// Verify Supabase JWT token
async function verifyToken(token) {
  try {
    const client = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch (err) {
    console.error('Token verification error:', err.message);
    return null;
  }
}

// ============= ROUTES =============

app.get('/api', (req, res) => {
  res.json({
    status: '✅ OK',
    service: 'Fintech Backend (Supabase + Para)',
    version: '2.0.0',
    deployment: 'Vercel Serverless',
    endpoints: {
      'POST /api/signup': 'Create user + auto-create wallet',
      'POST /api/login': 'Authenticate user, return JWT',
      'GET /api/wallet': 'Fetch wallet address + balance (requires Bearer token)',
      'POST /api/send': 'Build, sign, broadcast Sepolia transaction (requires Bearer token)',
    },
    docs: 'https://github.com/prajalsharma/fintech-backend-para',
  });
});

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const userId = data.user.id;

    try {
      const walletId = await createParaWallet(userId, email);
      const address = await getWalletAddress(walletId);

      res.json({
        user_id: userId,
        email: data.user.email,
        wallet_address: address,
      });
    } catch (walletErr) {
      console.error('Wallet creation error:', walletErr.message);
      res.status(200).json({
        user_id: userId,
        email: data.user.email,
        wallet_address: null,
        warning: 'User created but wallet creation failed',
      });
    }
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
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

app.get('/api/wallet', async (req, res) => {
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
      return res.status(404).json({ error: 'Wallet not found in session' });
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

app.post('/api/send', async (req, res) => {
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
      return res.status(404).json({ error: 'Wallet not found in session' });
    }

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
      data: '0x',
    };

    const unsignedTx = ethers.Transaction.from(tx);
    const unsignedSerialized = unsignedTx.unsignedSerialized;
    const digest = ethers.keccak256(unsignedSerialized);

    const signRes = await paraRequest('POST', `/wallets/${walletId}/sign-raw`, {
      data: digest,
    });

    const signature = ethers.Signature.from(signRes.signature);
    const serialized = ethers.serializeTransaction(unsignedTx, signature);

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

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
  });
});

export default app;
