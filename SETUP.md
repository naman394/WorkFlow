# Setup Instructions for Cookie-Licking Detector

## GitHub OAuth Setup

To enable GitHub authentication and repository selection, follow these steps:

### 1. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" in the left sidebar
3. Click "New OAuth App"
4. Fill in the details:
   - **Application name**: Cookie-Licking Detector
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
5. Click "Register application"
6. You'll get a **Client ID** and can generate a **Client Secret**

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Add your GitHub OAuth credentials to `.env.local`:
   ```
   GITHUB_ID=your_client_id_here
   GITHUB_SECRET=your_client_secret_here
   NEXTAUTH_SECRET=your_random_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Generate a secure NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

### 3. Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 and click "Get started for free" to:
1. Authenticate with GitHub
2. Select repositories to monitor
3. Start tracking cookie-licking issues!

## Features

- ✅ GitHub OAuth authentication
- ✅ Repository selection interface
- ✅ Fetch all user repositories
- ✅ Search and filter repositories  
- ✅ Multi-select repositories to monitor
- ✅ Beautiful dark UI with animations

## Next Steps

After selecting repositories, you'll be redirected to the dashboard where you can:
- View detected cookie-licking patterns
- Monitor contributor behavior
- Configure auto-resolution settings
- View analytics and insights

