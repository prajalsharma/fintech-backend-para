# Troubleshooting Guide

## 🔧 npm Install Issues

### Error: "404 Not Found - @supabase/auth-helpers-node"

**Problem:**
```
npm error 404 Not Found - GET https://registry.npmjs.org/@supabase%2fauth-helpers-node
Error: Command "npm install" exited with 1
```

**Cause:** The package `@supabase/auth-helpers-node` version might not exist or was deprecated.

**Solution:** Use the correct Supabase client package:

✅ **CORRECT** (What we're using now):
```json
"@supabase/supabase-js": "^2.38.4"
```

❌ **WRONG** (What was causing the error):
```json
"@supabase/auth-helpers-node": "^0.4.6"
```

**To fix locally:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 🐛 Common Runtime Errors

### Error: "Missing environment variables"

**Problem:**
```
TypeError: Cannot read property 'url' of undefined
```

**Cause:** One or more environment variables not set.

**Solution:**
1. Check `.env` file exists in project root
2. Verify all 4 required variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PARA_API_KEY`
   - `INFURA_KEY`

```bash
# Verify locally
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
echo $PARA_API_KEY
echo $INFURA_KEY
```

---

### Error: "Supabase: Invalid token"

**Problem:**
```
Error: Invalid Supabase token
```

**Causes & Solutions:**

1. **Wrong API key type**
   - ✅ Use "Anon public key" (not Service Role)
   - Go to: Supabase Dashboard → Settings → API
   - Copy the "Anon public key"

2. **Token expired**
   - Tokens expire. User needs to re-login
   - Clear old tokens and re-authenticate

3. **Malformed token**
   - Ensure token hasn't been modified
   - Re-copy from Supabase dashboard

---

### Error: "Para API error: Invalid API key"

**Problem:**
```
Error: Para API error: Invalid API key
```

**Causes & Solutions:**

1. **Wrong API key**
   - Go to: Para Dashboard → API Keys
   - Copy the full API key
   - Should start with `beta_` or `prod_`

2. **API key expired**
   - Generate a new API key from Para Dashboard
   - Update in Vercel environment variables
   - Redeploy

3. **Key not in environment**
   - Check `PARA_API_KEY` is set
   - On Vercel: Settings → Environment Variables
   - Verify you redeployed after adding it

---

### Error: "Wallet creation timeout"

**Problem:**
```
Error: Wallet creation timeout
```

**Causes & Solutions:**

1. **Para API is slow**
   - Wallet creation takes 1-2 seconds
   - Try again - may be temporary slowness

2. **Network issue**
   - Check your internet connection
   - Try again in a few seconds

3. **Para service down**
   - Check Para status page
   - May need to wait for service recovery

**Temporary fix:** Increase timeout in `server.js`:
```javascript
while (status !== 'ready' && attempts < 60) {  // Changed from 30 to 60
  await new Promise((r) => setTimeout(r, 500));
  // ...
}
```

---

### Error: "Cannot connect to RPC"

**Problem:**
```
Error: Failed to fetch
Error: Connection refused
```

**Causes & Solutions:**

1. **Wrong RPC URL**
   - Should be: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`
   - Not: `https://localhost:8545` (that's local)
   - Not: Just the API key

2. **Invalid Alchemy key**
   - Go to: Alchemy Dashboard → API Keys
   - Copy full Sepolia RPC key
   - Update `INFURA_KEY` in environment

3. **Rate limited**
   - Free tier has rate limits
   - Upgrade Alchemy plan
   - Spread API calls over time

---

### Error: "Insufficient gas"

**Problem:**
```
Error: Transaction reverted
Error: Out of gas
```

**Causes & Solutions:**

1. **Wallet not funded**
   - Get wallet address from `/wallet` endpoint
   - Use [Sepolia Faucet](https://sepolia-faucet.pk910.de/)
   - Wait for confirmation (~30 seconds)

2. **Gas price too low**
   - Code uses current network gas prices
   - Usually handles automatically
   - Check balance is > 0.01 ETH for test

3. **Send amount too large**
   - If sending 10 ETH but wallet has 0.5
   - Reduce amount in test

---

## 🌐 Vercel Deployment Issues

### Build fails on Vercel

**Problem:**
```
Error: Command "npm install" exited with 1
```

**Solutions:**

1. **Delete Vercel cache and redeploy**
   - Go to Vercel Dashboard
   - Go to Deployments
   - Click "..." on latest
   - Select "Redeploy (with cache cleared)"

2. **Check environment variables**
   - All 4 required variables set?
   - Applied to Production environment?
   - Values copied exactly (no spaces)?

3. **Check package.json**
   - Use correct versions:
   ```json
   "express": "^4.18.2",
   "@supabase/supabase-js": "^2.38.4",
   "ethers": "^6.11.1",
   "dotenv": "^16.3.1",
   "node-fetch": "^3.3.2"
   ```

---

### "502 Bad Gateway" or "500 Internal Server Error"

**Problem:**
```
502 Bad Gateway
500 Internal Server Error
```

**Causes & Solutions:**

1. **Server not starting**
   - Check `server.js` for syntax errors
   - Verify all imports are correct
   - Check all environment variables are used

2. **Environment variables not loaded**
   - Variables must be set in Vercel
   - Cannot use local `.env` on Vercel
   - Redeploy after adding variables

3. **Third-party API down**
   - Supabase down → auth fails
   - Para down → wallet creation fails
   - Alchemy down → RPC calls fail
   - Check status pages and try again

4. **Cold start timeout**
   - First request takes longer (cold start)
   - Should work on retry
   - Upgrade Vercel plan for faster cold starts

---

### "401 Unauthorized" on Vercel

**Problem:**
```
401 Unauthorized
Error: Invalid token
```

**Solutions:**

1. **Token format wrong**
   - Format: `Authorization: Bearer TOKEN`
   - NOT: `Authorization: TOKEN`
   - NOT: `Authorization: Token TOKEN`

2. **Token expired**
   - Re-login to get fresh token
   - Tokens expire after ~1 hour

3. **SUPABASE_ANON_KEY wrong**
   - Double-check it's the "Anon public key"
   - Not the service role key
   - Copy from Supabase dashboard again

---

## 🧪 Testing Issues

### "Cannot find module 'node-fetch'"

**Problem:**
```
Error: Cannot find module 'node-fetch'
```

**Solution:**
```bash
npm install node-fetch
```

---

### Test script doesn't start server automatically

**Problem:**
```
Error: Cannot POST http://localhost:3000/signup
```

**Solution:**
Start server in one terminal, tests in another:

**Terminal 1:**
```bash
npm start
```

**Terminal 2:**
```bash
npm test
```

---

### "Wallet has insufficient balance" test warning

**Problem:**
```
⚠ Wallet has insufficient balance for test transaction
⚠ Fund wallet with Sepolia ETH from: https://sepolia-faucet.pk910.de/
```

**Solution:**
1. Get wallet address from `/wallet` endpoint
2. Go to [Sepolia Faucet](https://sepolia-faucet.pk910.de/)
3. Paste address and claim ETH
4. Wait ~30 seconds for confirmation
5. Run tests again

---

## 🆘 Still Having Issues?

### Debug Steps

1. **Check logs**
   - Local: Check console output
   - Vercel: Go to Deployments → Click deployment → View logs

2. **Verify credentials**
   - Use exact values from dashboards
   - No typos or extra spaces
   - Check for special characters

3. **Test each service separately**
   ```bash
   # Test Supabase
   curl -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test"}'

   # Test Para (requires auth first)
   curl -X GET http://localhost:3000/wallet \
     -H "Authorization: Bearer TOKEN"
   ```

4. **Check service status**
   - [Supabase Status](https://status.supabase.com)
   - [Alchemy Status](https://status.alchemy.com)
   - [Para Status](https://status.getpara.com)

5. **Clear cache and redeploy**
   ```bash
   # Locally
   rm -rf node_modules package-lock.json
   npm install
   npm start

   # On Vercel
   Clear cache → Redeploy
   ```

---

## 📞 Need More Help?

- GitHub Issues: [prajalsharma/fintech-backend-para/issues](https://github.com/prajalsharma/fintech-backend-para/issues)
- Check DEPLOYMENT.md for deployment troubleshooting
- Check TESTING.md for testing issues
- Check README.md for setup issues

---

**Most issues are environment variables not being set correctly. Double-check all 4 are in place!**
