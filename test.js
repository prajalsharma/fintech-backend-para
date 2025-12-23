import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Test user credentials
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

let accessToken = null;
let walletAddress = null;

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(status, message, data = null) {
  const color =
    status === '✓' ? colors.green : status === '✗' ? colors.red : colors.blue;
  console.log(`${color}${status}${colors.reset} ${message}`);
  if (data) console.log(`  ${JSON.stringify(data, null, 2).split('\n').join('\n  ')}`);
}

async function test(name, fn) {
  try {
    console.log(`\n${colors.yellow}→ ${name}${colors.reset}`);
    await fn();
  } catch (err) {
    log('✗', `Test failed: ${err.message}`);
    console.error(err);
  }
}

async function request(method, endpoint, body = null, headers = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  const data = await res.json();

  return { status: res.status, data };
}

async function runTests() {
  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Fintech Backend Integration Tests${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`Server: ${BASE_URL}`);
  console.log(`Test Email: ${testUser.email}\n`);

  // Test 1: Signup
  await test('POST /signup - Create user & wallet', async () => {
    const { status, data } = await request('POST', '/signup', testUser);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${data.error || data.message}`);
    }

    if (!data.user_id || !data.wallet_address) {
      throw new Error('Missing user_id or wallet_address in response');
    }

    walletAddress = data.wallet_address;
    log('✓', 'User created successfully');
    log('✓', `Wallet address: ${walletAddress}`);
    log('✓', `User ID: ${data.user_id}`);
  });

  // Test 2: Login
  await test('POST /login - Authenticate user', async () => {
    const { status, data } = await request('POST', '/login', testUser);

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${data.error || data.message}`);
    }

    if (!data.access_token) {
      throw new Error('Missing access_token in response');
    }

    accessToken = data.access_token;
    log('✓', 'Login successful');
    log('✓', `Token: ${accessToken.substring(0, 20)}...`);
  });

  // Test 3: Get Wallet
  await test('GET /wallet - Fetch wallet address & balance', async () => {
    if (!accessToken) {
      throw new Error('No access token from login test');
    }

    const { status, data } = await request('GET', '/wallet', null, {
      Authorization: `Bearer ${accessToken}`,
    });

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${data.error || data.message}`);
    }

    if (!data.address || data.balance_eth === undefined) {
      throw new Error('Missing address or balance_eth in response');
    }

    log('✓', 'Wallet fetched successfully');
    log('✓', `Address: ${data.address}`);
    log('✓', `Balance: ${data.balance_eth} ETH`);

    // Verify address matches
    if (data.address.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Wallet address mismatch');
    }
  });

  // Test 4: Send Transaction (optional - requires funded wallet)
  await test('POST /send - Send Sepolia ETH (requires funded wallet)', async () => {
    if (!accessToken) {
      throw new Error('No access token from login test');
    }

    // Get current balance first
    const { data: walletData } = await request('GET', '/wallet', null, {
      Authorization: `Bearer ${accessToken}`,
    });

    const balance = parseFloat(walletData.balance_eth);
    log('✓', `Current balance: ${balance} ETH`);

    if (balance < 0.01) {
      log('⚠', 'Wallet has insufficient balance for test transaction');
      log('⚠', 'Fund wallet with Sepolia ETH from: https://sepolia-faucet.pk910.de/');
      return;
    }

    const sendData = {
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f42e2e',
      amount: '0.001',
    };

    const { status, data } = await request('POST', '/send', sendData, {
      Authorization: `Bearer ${accessToken}`,
    });

    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}: ${data.error || data.message}`);
    }

    if (!data.transaction_hash) {
      throw new Error('Missing transaction_hash in response');
    }

    log('✓', 'Transaction sent successfully');
    log('✓', `TX Hash: ${data.transaction_hash}`);
    log('✓', `From: ${data.from}`);
    log('✓', `To: ${data.to}`);
    log('✓', `Amount: ${data.amount} ETH`);
    log('✓', `View on Sepolia: https://sepolia.etherscan.io/tx/${data.transaction_hash}`);
  });

  // Test 5: Verify unauthorized access
  await test('GET /wallet - Verify auth protection (invalid token)', async () => {
    const { status, data } = await request('GET', '/wallet', null, {
      Authorization: 'Bearer invalid_token',
    });

    if (status === 401) {
      log('✓', 'Auth protection working correctly');
    } else {
      throw new Error(`Expected 401 for invalid token, got ${status}`);
    }
  });

  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}All tests completed!${colors.reset}\n`);
}

// Run tests
runTests().catch(console.error);
