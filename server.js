import express from 'express';
import { createClient } from '@supabase/auth-helpers-node';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Para REST client
const PARA_API_KEY = process.env.PARA_API_KEY;
const PARA_BASE_URL = 'https://api.getpara.com/v2';
const PARA_ENV = 'BETA';

// Sepolia RPC
const RPC_URL = 'https://sepolia.infura.io/v3/' + process.env.INFURA_KEY;
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
    throw new Error(`Para API error: ${data.message || res.statusText}`);
  }
  return data;
}

async function createParaWallet(userId) {
  // Create EVM wallet
  const res = await paraRequest('POST', '/wallets', {
    chain: 'evm',
    environment: PARA_ENV,
  });

  const walletId = res.id;

  // Poll until ready
  let status = 'creating';
  let attempts = 0;
  while (status !== 'ready' && attempts < 30) {
    await new Promise((r) => setTimeout(r, 500));
    const wallet = await paraRequest('GET', `/wallets/${walletId}`);
    status = wallet.status;
    attempts++;
  }

  if (status !== 'ready') {
    throw new Error('Wallet creation timeout');
  }

  // Store mapping
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

    // Create Para wallet
    const walletId = await createParaWallet(userId);
    const address = await getWalletAddress(walletId);

    res.json({
      user_id: userId,
      email: data.user.email,
      wallet_address: address,
    });
  } catch (err) {
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    };

    // Hash unsigned transaction
    const unsignedTx = ethers.Transaction.from(tx);
    const txHash = unsignedTx.unsignedHash;

    // Sign with Para
    const signRes = await paraRequest('POST', `/wallets/${walletId}/sign-raw`, {
      message: txHash,
    });

    const signature = signRes.signature;

    // Serialize signed transaction
    unsignedTx.signature = ethers.Signature.from(signature);
    const serialized = unsignedTx.serialized;

    // Broadcast
    const txRes = await provider.broadcastTransaction(serialized);

    res.json({
      transaction_hash: txRes.hash,
      from: fromAddress,
      to,
      amount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============= SERVER =============

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
