# Complete Setup & Troubleshooting Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd fintech-backend-para
npm install
```

**Expected output:**
```
added 450+ packages in X seconds
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

**Edit `.env` and fill in ALL 4 variables:**

```env
# Get from Supabase dashboard (https://supabase.com)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get from Para dashboard (https://getpara.com)
PARA_API_KEY=sk_test_...

# Get from Alchemy (https://www.alchemy.com)
INFURA_KEY=<your-alchemy-key>
```

**⚠️ IMPORTANT:** All 4 variables must be filled. If any are missing, you'll get errors.

### Step 3: Start the Server

```bash
npm start
```

**Expected output:**
```
✅ Server running on http://localhost:3000
🌐 UI available at http://localhost:3000
📖 API Documentation at http://localhost:3000/api
```

### Step 4: Test in Browser

Open: `http://localhost:3000`

You should see the dark-themed UI with 4 tabs.

---

## ❌ Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

**Cause:** Dependencies not installed

**Fix:**
```bash
npm install
```

---

### Error: "supabase.auth.signUpWithPassword is not a function"

**Cause:** Supabase not properly initialized (missing `.env` variables)

**Fix:**

1. Check `.env` file exists:
   ```bash
   cat .env
   ```

2. Verify ALL 4 variables are set:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   echo $PARA_API_KEY
   echo $INFURA_KEY
   ```

3. If any are empty, fill them in `.env`

4. Restart server:
   ```bash
   npm start
   ```

---

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Frontend and backend on different ports/domains

**Fix:** Make sure frontend is accessing `http://localhost:3000`, not a different port.

---

### Error: "Signup failed" or "Login failed" with no details

**Cause:** Backend endpoint returning error

**Fix:**

1. Check server logs in terminal
2. Verify `.env` variables are correct
3. Test endpoint directly with curl:
   ```bash
   curl -X POST http://localhost:3000/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234!"}'
   ```

---

### Error: "Wallet creation timeout"

**Cause:** Para API is slow or unreachable

**Fix:**

1. Check `PARA_API_KEY` is correct
2. Check network connectivity
3. Try again (Para sometimes takes 1-2 seconds)

---

### Error: "Invalid token" when fetching wallet

**Cause:** JWT token expired or invalid

**Fix:**

1. Log in again (token is in-memory only)
2. Try wallet fetch immediately after login

---

### Error: "Wallet not found"

**Cause:** Your wallet mapping was lost (in-memory storage)

**Fix:**

1. Sign up again (creates new wallet)
2. For production: use database for persistent storage

---

### Error: Port 3000 already in use

**Cause:** Another process using port 3000

**Fix:**

Option A: Use different port
```bash
PORT=3001 npm start
```

Option B: Kill process on port 3000
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Server starts with `npm start` (no errors)
- [ ] Logs show "✅ Server running on http://localhost:3000"
- [ ] Frontend loads at `http://localhost:3000` (dark theme)
- [ ] Can see 4 tabs: Signup, Login, Wallet, Send
- [ ] Signup form accepts email + password
- [ ] Signup shows success with wallet address
- [ ] Login form accepts email + password  
- [ ] Login shows success message
- [ ] Wallet tab shows "Please login first" initially
- [ ] After login, wallet button fetches address + balance
- [ ] Send tab shows form for recipient + amount

---

## 🔍 How to Debug

### Check Backend Logs

Watch server logs in terminal to see what's happening:
```bash
npm start
# Watch logs here for errors
```

### Check Browser Console

1. Open `http://localhost:3000`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for any red error messages
5. Try signup/login and watch console

### Test Backend Directly

```bash
# Test signup
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Should return:
# {"user_id":"uuid","email":"test@example.com","wallet_address":"0x..."}

# Test login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Should return:
# {"user_id":"uuid","email":"test@example.com","access_token":"eyJ..."}
```

### Check .env File

```bash
# Verify file exists
ls -la .env

# Check contents (don't share output with anyone!)
cat .env

# Verify all 4 variables are set
grep -E "^(SUPABASE|PARA|INFURA)" .env
```

---

## 📊 Expected Data Flows

### Signup Flow
```
User fills form (email, password)
           ↓
Frontend: fetch("/signup", {email, password})
           ↓
Backend: supabase.auth.signUpWithPassword()
           ↓
Backend: para.createWallet()
           ↓
Frontend: Show wallet_address ✓
```

### Login Flow
```
User fills form (email, password)
           ↓
Frontend: fetch("/login", {email, password})
           ↓
Backend: supabase.auth.signInWithPassword()
           ↓
Frontend: Store JWT token ✓
```

### Wallet Fetch Flow
```
User clicks "Fetch Wallet"
           ↓
Frontend: fetch("/wallet", {Authorization: Bearer <JWT>})
           ↓
Backend: Verify JWT → Query Para → Query RPC
           ↓
Frontend: Show address + balance ✓
```

### Send Flow
```
User enters recipient + amount
           ↓
Frontend: fetch("/send", {to, amount}, {Authorization: Bearer <JWT>})
           ↓
Backend: Verify JWT → Build TX → Para.sign() → Broadcast
           ↓
Frontend: Show tx_hash ✓
```

---

## 🔐 Security Reminders

- ✅ Frontend NEVER calls Supabase directly
- ✅ Frontend NEVER calls Para directly
- ✅ Secrets are ONLY in `.env`
- ✅ Secrets are NEVER logged or exposed
- ✅ Backend controls all Supabase operations
- ✅ Backend controls all Para operations
- ✅ Frontend gets only public data (addresses, balances, tx hashes)

---

## 📞 Still Having Issues?

1. Check all 4 environment variables are set
2. Verify backend is running (check logs)
3. Check browser console (F12) for errors
4. Test backend directly with curl
5. Read TROUBLESHOOTING.md for more details
6. Check GitHub issues: https://github.com/prajalsharma/fintech-backend-para/issues

---

## 🎓 Next Steps

After verifying everything works:

1. **Read the code:** Understand how signup/login/wallet/send work
2. **Test the API:** Use curl/Hoppscotch to understand endpoints
3. **Deploy:** Follow DEPLOYMENT.md to deploy to Vercel
4. **Persist storage:** Replace `walletMap` with database
5. **Add features:** Implement additional functionality

---

## 📚 Additional Resources

- [FRONTEND.md](./FRONTEND.md) - Frontend guide
- [TESTING.md](./TESTING.md) - API testing guide  
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to Vercel
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [ARCHITECTURE_VERIFICATION.md](./ARCHITECTURE_VERIFICATION.md) - Architecture details
