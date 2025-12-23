# Error Solutions Guide

## Error: "supabase.auth.signUpWithPassword is not a function"

This is the most common error you're encountering. Here's exactly how to fix it.

---

## 🔍 What This Error Means

```
supabase.auth.signUpWithPassword is not a function
```

This error happens when:
1. ❌ Supabase client is NOT properly initialized
2. ❌ Environment variables are MISSING or WRONG
3. ❌ `@supabase/supabase-js` package is NOT installed
4. ❌ Backend server is NOT running

---

## ✅ Step-by-Step Fix

### Fix #1: Check if Backend is Running

**Open a terminal and check if the server is running:**

```bash
# Check if port 3000 is listening
lsof -i :3000
```

**Expected output:**
```
COMMAND   PID  USER  FD   TYPE DEVICE SIZE/OFF NODE NAME
node      123  user  123  IPv4 ...     0t0      *:3000 (LISTEN)
```

**If nothing shows up:** Backend is NOT running!

**Solution:** Start the backend
```bash
npm start
```

**Expected output in terminal:**
```
✅ Server running on http://localhost:3000
🌐 UI available at http://localhost:3000
📖 API Documentation at http://localhost:3000/api
```

---

### Fix #2: Check Environment Variables

**The error usually happens because `.env` is missing or incomplete.**

**Step 1: Check if `.env` file exists**

```bash
ls -la .env
```

**If file not found:** Create it!
```bash
cp .env.example .env
```

**Step 2: Verify `.env` has ALL 4 required variables**

```bash
cat .env
```

**Should show:**
```env
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
PARA_API_KEY=sk_test_...
INFURA_KEY=...
```

**If any are empty or missing:** That's the problem!

---

### Fix #3: Get Your Supabase Keys

**The error happens because Supabase credentials are missing.**

**Step 1: Go to Supabase Dashboard**

1. Visit: https://supabase.com
2. Sign in or create account
3. Create new project (or use existing)
4. Go to **Project Settings** → **API**

**Step 2: Copy the Keys**

You'll see:
- **Project URL** → Copy to `SUPABASE_URL`
- **Anon Public Key** → Copy to `SUPABASE_ANON_KEY`

**Example:**
```
SUPABASE_URL=https://your-project-abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 3: Update `.env` file**

```bash
nano .env  # or use your favorite editor
```

Paste the values:
```env
SUPABASE_URL=https://your-project-abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PARA_API_KEY=sk_test_...  # Get from Para dashboard
INFURA_KEY=...  # Get from Alchemy
```

---

### Fix #4: Get Your Para API Key

**Step 1: Go to Para Dashboard**

1. Visit: https://getpara.com
2. Sign in or create account
3. Create new API key
4. Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)

**Step 2: Update `.env`**

```env
PARA_API_KEY=sk_test_your_actual_key_here
```

---

### Fix #5: Get Your Alchemy/Infura Key

**Step 1: Go to Alchemy**

1. Visit: https://www.alchemy.com
2. Sign in or create account
3. Create new app (select "Sepolia" network)
4. Copy the API key

**Step 2: Update `.env`**

```env
INFURA_KEY=your_alchemy_key_here
```

---

### Fix #6: Install Dependencies

**The error can also happen if packages aren't installed.**

```bash
npm install
```

**Expected output:**
```
added 450+ packages
```

---

### Fix #7: Restart the Server

**After updating `.env`, restart the backend:**

```bash
# Stop current server (Ctrl+C in terminal)
# Then start it again
npm start
```

**Expected output:**
```
✅ Server running on http://localhost:3000
🌐 UI available at http://localhost:3000
```

---

## 🧪 Verify It's Fixed

### Test 1: Open Frontend

Go to: `http://localhost:3000`

You should see the dark-themed UI with 4 tabs.

### Test 2: Try Signup

1. Click **Signup** tab
2. Enter email: `test@example.com`
3. Enter password: `Test1234!`
4. Click "Sign Up"

**Expected result:**
```
✓ Account created! Wallet: 0x...
```

**If you still see the error:** Check your `.env` file again.

### Test 3: Check Server Logs

Watch the terminal where `npm start` is running. You should see:

```
POST /signup
✅ User created: user@example.com
✅ Wallet created: walletId
```

---

## 🐛 Advanced Debugging

### Test Backend Directly with Curl

If frontend still shows error, test the backend directly:

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

**Expected response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
}
```

**If you get an error:** Copy the error message and check the relevant section below.

### Check .env Variables

```bash
# Print each variable
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: $SUPABASE_ANON_KEY"
echo "PARA_API_KEY: $PARA_API_KEY"
echo "INFURA_KEY: $INFURA_KEY"
```

**All 4 should have values.** If any are blank, that's the problem.

### Check if Packages are Installed

```bash
ls node_modules/@supabase/supabase-js
```

**If "No such file or directory": Run `npm install`**

### Look at Server Logs

Watch the terminal where you ran `npm start`. If there's an error message, copy it and search:
1. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - General troubleshooting
2. This file - Specific error solutions

---

## ❓ Common Questions

### Q: Where do I find SUPABASE_URL?
**A:** Supabase Dashboard → Project Settings → API → Project URL

### Q: What if I don't have a Supabase account?
**A:** Create one free at https://supabase.com

### Q: Is the PARA_API_KEY secret?
**A:** YES. Don't share it or commit it to GitHub.

### Q: Can I use a different API provider?
**A:** No, this project uses Supabase, Para, and Alchemy specifically.

### Q: Why does signup take a while?
**A:** Para wallet creation can take 1-2 seconds. This is normal.

### Q: What if I lose my `.env` file?
**A:** Run `cp .env.example .env` and fill in values again.

---

## ✅ Verification Checklist

Before trying signup again, verify:

- [ ] Backend is running (`npm start`)
- [ ] `.env` file exists
- [ ] All 4 variables are filled in `.env`:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `PARA_API_KEY`
  - [ ] `INFURA_KEY`
- [ ] Server logs show "✅ Server running"
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Curl test works (see Advanced Debugging)

---

## 🆘 Still Not Working?

If you've done all the above and still getting errors:

1. **Check exact error message** - Copy the full error from browser console or server logs
2. **Verify credentials** - Make sure keys are copied correctly (no extra spaces)
3. **Restart everything** - Kill server, close browser, start again
4. **Check network** - Make sure you can access supabase.com and getpara.com
5. **Review documentation** - Check each service's docs (Supabase, Para, Alchemy)

---

## 📞 Getting Help

If you're still stuck:

1. Check GitHub Issues: https://github.com/prajalsharma/fintech-backend-para/issues
2. Read ARCHITECTURE_VERIFICATION.md for system overview
3. Review SETUP_GUIDE.md for step-by-step instructions
4. Check server logs for exact error message

---

## 🎯 Quick Reference

**The 3 Most Common Causes:**

1. **`.env` file is missing** → Run: `cp .env.example .env`
2. **`.env` variables are empty** → Get keys from Supabase/Para/Alchemy
3. **Backend not running** → Run: `npm start`

**If none of those work:** Check browser console (F12) and server logs for the actual error message.
