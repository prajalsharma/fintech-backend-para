# Deployment Guide: Vercel

## Quick Deploy

### Option 1: One-Click Deploy (Fastest)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select `fintech-backend-para` repository
5. Click "Deploy"
6. Add environment variables (see below)
7. Done! 🎉

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

---

## 🔐 Environment Variables for Vercel

You need to set **5 environment variables** in Vercel project settings.

### **Variable 1: SUPABASE_URL**

**Key:** `SUPABASE_URL`

**Value:**
```
https://fqfncycbhpaivyqymumx.supabase.co
```

**Where to find:**
- Go to [app.supabase.com](https://app.supabase.com)
- Select your project
- Click "Settings" → "API"
- Copy "Project URL"

---

### **Variable 2: SUPABASE_ANON_KEY**

**Key:** `SUPABASE_ANON_KEY`

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZm5jeWNiaHBhaXZ5cXltdW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjM5ODMsImV4cCI6MjA4MTk5OTk4M30.5H3SsNG9DpmAfkX5UA8cV6DfLZafeH0K5TueQbXbF5w
```

**Where to find:**
- Go to [app.supabase.com](https://app.supabase.com)
- Select your project
- Click "Settings" → "API"
- Copy "Anon public key"

**⚠️ Important:** This key is safe to expose (it's "anon" - public)

---

### **Variable 3: PARA_API_KEY**

**Key:** `PARA_API_KEY`

**Value:**
```
beta_af6ef9d045152eaf7207be1430ee5676
```

**Where to find:**
- Go to [Para Dashboard](https://dashboard.getpara.com)
- Select your project
- API Keys section
- Copy your API key

**⚠️ IMPORTANT:** This is a SECRET. Never commit to GitHub or share publicly.

---

### **Variable 4: INFURA_KEY**

**Key:** `INFURA_KEY`

**Value:**
```
nwXWbXXntrP8P1jjipZCK
```

**Where to find:**
- Go to [infura.io](https://infura.io)
- Select your project
- Copy Sepolia RPC API key

**⚠️ IMPORTANT:** This is a SECRET. Never commit to GitHub.

---

### **Variable 5: PORT** (Optional)

**Key:** `PORT`

**Value:**
```
3000
```

**Note:** Vercel automatically sets PORT. You can skip this.

---

## Step-by-Step: Add Environment Variables to Vercel

### Step 1: Go to Vercel Project Settings

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `fintech-backend-para` project
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar

### Step 2: Add Each Variable

For each variable below, click "Add New" and enter:

**Variable 1:**
```
Key:   SUPABASE_URL
Value: https://fqfncycbhpaivyqymumx.supabase.co
Environments: Production, Preview, Development
```

**Variable 2:**
```
Key:   SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZm5jeWNiaHBhaXZ5cXltdW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjM5ODMsImV4cCI6MjA4MTk5OTk4M30.5H3SsNG9DpmAfkX5UA8cV6DfLZafeH0K5TueQbXbF5w
Environments: Production, Preview, Development
```

**Variable 3 (SECRET):**
```
Key:   PARA_API_KEY
Value: beta_af6ef9d045152eaf7207be1430ee5676
Environments: Production, Preview, Development
```

**Variable 4 (SECRET):**
```
Key:   INFURA_KEY
Value: nwXWbXXntrP8P1jjipZCK
Environments: Production, Preview, Development
```

### Step 3: Save & Redeploy

1. Click "Save" after each variable
2. Go to **Deployments** tab
3. Click "Redeploy" on latest deployment
4. Wait for build to complete (2-3 minutes)
5. Once green ✅ deployment is live

---

## ✅ Verify Deployment

### Get Your Vercel URL

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click `fintech-backend-para`
3. Copy the **Production URL** (e.g., `https://fintech-backend-para.vercel.app`)

### Test Endpoints

Replace `YOUR_VERCEL_URL` with your actual URL:

**Test Signup:**
```bash
curl -X POST https://YOUR_VERCEL_URL/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

**Test Login:**
```bash
curl -X POST https://YOUR_VERCEL_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

**Test Get Wallet (requires token from login):**
```bash
curl -X GET https://YOUR_VERCEL_URL/wallet \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔒 Environment Variables Checklist

Before deploying, verify you have:

- [ ] **SUPABASE_URL** - Your Supabase project URL
- [ ] **SUPABASE_ANON_KEY** - Your Supabase anon key (safe to expose)
- [ ] **PARA_API_KEY** - Your Para API key (SECRET - never share)
- [ ] **INFURA_KEY** - Your Alchemy/Infura API key (SECRET - never share)
- [ ] All 4 variables set in Vercel project settings
- [ ] Vercel deployment shows ✅ green status

---

## 🚨 Security Best Practices

### ✅ DO:
- ✅ Use Vercel's environment variables (encrypted)
- ✅ Set variables for all environments (Production, Preview, Development)
- ✅ Rotate API keys periodically
- ✅ Use different keys for mainnet vs testnet
- ✅ Monitor API usage on Para & Alchemy dashboards

### ❌ DON'T:
- ❌ Commit `.env` file to GitHub (it's in `.gitignore`)
- ❌ Paste secrets in code or comments
- ❌ Share API keys in Slack/Discord/emails
- ❌ Use same keys across multiple projects
- ❌ Log sensitive data

---

## 📊 Environment Variables Reference Table

| Variable | Required | Type | Where to Find | Example |
|----------|----------|------|---------------|----------|
| `SUPABASE_URL` | ✅ Yes | Public | Supabase Settings → API | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ Yes | Public | Supabase Settings → API | `eyJhbGc...` |
| `PARA_API_KEY` | ✅ Yes | **SECRET** | Para Dashboard → API Keys | `beta_xxx` |
| `INFURA_KEY` | ✅ Yes | **SECRET** | Alchemy Dashboard → API Key | `xxx` |
| `PORT` | ❌ Optional | Public | Default: 3000 | `3000` |

---

## 🐛 Troubleshooting

### "Build failed: Missing environment variables"

**Solution:** Ensure all 4 required variables are set in Vercel project settings.

```bash
# Verify locally first
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
echo $PARA_API_KEY
echo $INFURA_KEY
```

### "Cannot read property 'url' of undefined"

**Solution:** One or more env vars are missing or misspelled. Check:
1. Variable name matches exactly (case-sensitive)
2. Value is correct
3. You redeployed after adding variables

### "401 Supabase: Invalid token"

**Solution:** Check `SUPABASE_ANON_KEY` is correct. Copy from Supabase dashboard again.

### "Para API error: Invalid API key"

**Solution:** Check `PARA_API_KEY` is correct and valid. May have expired.

### "Connection refused: localhost:3000"

**Solution:** You're using localhost URL. Update to your Vercel URL:
```
https://YOUR_VERCEL_URL/endpoint
```

---

## 📈 Scaling Considerations

As traffic increases:

1. **API Rate Limits**
   - Para: Contact support for higher limits
   - Alchemy: Upgrade plan as needed
   - Supabase: Automatic scaling with usage

2. **Database (Future)**
   - Replace in-memory wallet map with Postgres
   - Use Supabase Postgres (included free tier)

3. **Caching**
   - Cache balance checks to reduce RPC calls
   - Use Redis for session management

4. **Monitoring**
   - Use Vercel Analytics for performance
   - Monitor API usage on Para/Alchemy dashboards
   - Set up alerts for errors

---

## 🎯 Example Vercel Dashboard Setup

Your Vercel project settings should look like:

```
Project Settings
├─ Environment Variables
│  ├─ SUPABASE_URL = https://fqfncycbhpaivyqymumx.supabase.co
│  ├─ SUPABASE_ANON_KEY = eyJhbGc...
│  ├─ PARA_API_KEY = beta_xxx (encrypted)
│  └─ INFURA_KEY = xxx (encrypted)
├─ Deployments
│  └─ Latest: ✅ Ready (green)
├─ Domains
│  └─ fintech-backend-para.vercel.app
└─ Git
   └─ Connected to prajalsharma/fintech-backend-para
```

---

## 🚀 Final Checklist Before Going Live

- [ ] All 4 environment variables set in Vercel
- [ ] Latest deployment shows ✅ green status
- [ ] Signup endpoint works
- [ ] Login endpoint works
- [ ] Wallet endpoint works (with Bearer token)
- [ ] Tested on Vercel URL (not localhost)
- [ ] API keys are valid and active
- [ ] No hardcoded secrets in code
- [ ] `.env` file is in `.gitignore`
- [ ] Ready for production traffic!

---

## 📚 Useful Links

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase API Keys](https://app.supabase.com/account/tokens)
- [Para Dashboard](https://dashboard.getpara.com)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Vercel Docs](https://vercel.com/docs)

---

**Your backend is production-ready! Deploy with confidence. 🚀**
