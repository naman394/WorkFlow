# 🚀 Quick Start Guide

## Setup GitHub OAuth (5 minutes)

### 1️⃣ Create GitHub OAuth App

1. Visit: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   ```
   Application name: Cookie-Licking Detector
   Homepage URL: http://localhost:3000
   Callback URL: http://localhost:3000/api/auth/callback/github
   ```
4. Click **"Register application"**
5. Copy your **Client ID**
6. Click **"Generate a new client secret"** and copy it

### 2️⃣ Create Environment File

```bash
# Create .env.local file
touch .env.local

# Open it and add (replace with your values):
GITHUB_ID=your_client_id_here
GITHUB_SECRET=your_client_secret_here
NEXTAUTH_SECRET=run_this_command_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

### 3️⃣ Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`

### 4️⃣ Start the App

```bash
npm run dev
```

### 5️⃣ Test It Out!

1. Open http://localhost:3000
2. Click **"Get started for free"**
3. Authenticate with GitHub
4. Select repositories to monitor
5. Done! 🎉

---

## Need Help?

- See `env-example.txt` for environment variable template
- See `SETUP.md` for detailed instructions
- Make sure your GitHub OAuth callback URL matches exactly

## What You'll Get

✅ GitHub OAuth authentication  
✅ Repository selection interface  
✅ Real-time issue monitoring  
✅ Cookie-licking detection  
✅ Beautiful dashboard

