# 🚀 Quick Fix - "supabase.auth.signUpWithPassword is not a function"

**Experiencing this error? Follow these 5 steps (5 minutes):**

---

## ⚠️ TL;DR

Your `.env` file is probably empty or missing. The error happens when Supabase can't initialize.

**Most likely fix:**
```bash
# Copy template
cp .env.example .env

# Edit .env and fill in ALL 4 keys:
# - SUPABASE_URL (from supabase.com)
# - SUPABASE_ANON_KEY (from supabase.com)
# - PARA_API_KEY (from getpara.com)
# - INFURA_KEY (from alchemy.com)

# Restart backend
npm start
```

Then try signup again. **It should work now.**

---

## 💯 What Went Wrong?

The error `"supabase.auth.signUpWithPassword is not a function"` means:

**Your backend tried to create a Supabase user, but Supabase couldn't initialize because your credentials are missing.**

This is a backend problem, not a frontend problem. The frontend code is correct.

---

## ✅ 5-Step Fix

### Step 1: Stop the Server (if running)
```bash
# Press Ctrl+C in the terminal where you ran `npm start`
```

### Step 2: Create `.env` File
```bash
cp .env.example .env
```

### Step 3: Get Your Credentials

**For SUPABASE_URL and SUPABASE_ANON_KEY:**
1. Go to https://supabase.com
2. Sign in or create account
3. Create new project (if you don't have one)
4. Click **Project Settings** → **API**
5. Copy **Project URL** and **Anon Public Key**

**For PARA_API_KEY:**
1. Go to https://getpara.com
2. Sign in or create account
3. Create API key
4. Copy the **Secret Key** (starts with `sk_test_`)

**For INFURA_KEY:**
1. Go to https://www.alchemy.com
2. Sign in or create account
3. Create app (select Sepolia network)
4. Copy API Key

### Step 4: Edit `.env` File

```bash
nano .env  # or use VS Code: code .env
```

**Fill in all 4 values:**
```env
SUPABASE_URL=https://your-project-abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PARA_API_KEY=sk_test_your_actual_key
INFURA_KEY=your_alchemy_key_here
```

**Save the file** (Ctrl+X in nano, then Y, then Enter)

### Step 5: Start Backend

```bash
npm start
```

**You should see:**
```
✅ Server running on http://localhost:3000
🌐 UI available at http://localhost:3000
```

---

## 🧪 Test It

1. Open browser: `http://localhost:3000`
2. Click **Signup** tab
3. Enter email: `test@example.com`
4. Enter password: `Test1234!`
5. Click "Sign Up"

**Expected result:**
```
✓ Account created! Wallet: 0x...
```

If this shows up, **you're done!** 🎉

---

## ❌ Still Getting Error?

### Check #1: Is `.env` File Correct?
```bash
cat .env
```

You should see all 4 variables with values. If any are empty:
- Get the missing key from the services (see Step 3 above)
- Update `.env`
- Restart backend

### Check #2: Is Backend Running?
```bash
lsof -i :3000
```

Should show `node` process. If not:
```bash
npm start
```

### Check #3: Are Credentials Correct?

Test directly with curl:
```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

**Should return:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
}
```

If you get an error:
- Copy the exact error message
- Read [ERROR_SOLUTIONS.md](./ERROR_SOLUTIONS.md) for that specific error

---

## 📖 Full Documentation

For detailed help:
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[ERROR_SOLUTIONS.md](./ERROR_SOLUTIONS.md)** - All error solutions
- **[ARCHITECTURE_VERIFICATION.md](./ARCHITECTURE_VERIFICATION.md)** - How system works

---

## 🌟 Pro Tips

1. **Save your credentials somewhere** - You'll need them later
2. **Don't share `.env` file** - It contains secrets!
3. **Use a `.env` manager** - Tools like `direnv` help manage credentials
4. **For production** - Use a secrets management service

---

## ✅ Success Checklist

- [ ] `.env` file created with `cp .env.example .env`
- [ ] All 4 variables filled in `.env`:
  - [ ] `SUPABASE_URL` from supabase.com
  - [ ] `SUPABASE_ANON_KEY` from supabase.com
  - [ ] `PARA_API_KEY` from getpara.com
  - [ ] `INFURA_KEY` from alchemy.com
- [ ] Backend running (`npm start`)
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Signup works (shows wallet address)

**If all checked: You're ready to go!** 🚀

---

## 📁 Next Steps

After signup works:

1. **Test Login** - Try logging in with same email/password
2. **View Wallet** - Click Wallet tab to see address + balance
3. **Get Test ETH** - Use Sepolia faucet to get free ETH
4. **Send Crypto** - Try sending ETH to another address
5. **Read Code** - Understand how it works in `server.js` and `public/index.html`

---

**Questions? Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) or check [ERROR_SOLUTIONS.md](./ERROR_SOLUTIONS.md)** 📖
