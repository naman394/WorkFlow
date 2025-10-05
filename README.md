# 🍪 Workflow

> **AI-Powered Issue Management for Open Source Projects**

An intelligent solution that tackles the "Reserved Issue" problem in open source by detecting stale claims, predicting contributor success, and automating intervention strategies.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/naman394/WorkFlow)
[![GitHub](https://img.shields.io/github/license/naman394/WorkFlow)](https://github.com/naman394/WorkFlow/blob/main/LICENSE)

## 🎯 The Problem

In open source projects, contributors often "claim" issues by commenting ("I'll work on this", "please assign this to me"), then never deliver. This phenomenon, known as **"cookie-licking"**, creates several problems:

- 🔒 Issues appear "taken" but remain unworked
- 😞 Frustrates newcomers who can't contribute
- 📉 Slows down project progress
- 🤝 Damages community trust and collaboration

## 🚀 Our Solution

Workflow uses **predictive AI** and **intelligent automation** to:

- 🔍 **Detect** claimed issues with no progress
- 📊 **Analyze** contributor behavior patterns and reliability scores
- 💬 **Intervene** with smart nudging (not just bot messages)
- 🔄 **Auto-release** stale claims after configurable grace periods
- 🎯 **Predict** which claims are likely to succeed or fail
- 📧 **Notify** maintainers and contributors automatically

## ✨ Key Features

### 🧠 **Smart Detection**
- **Pattern Recognition**: Detects 50+ claim patterns in issue comments
- **Real-time Analysis**: Processes GitHub webhooks for instant updates
- **Multi-language Support**: Works with any programming language

### 📈 **Predictive Analytics**
- **Contributor Scoring**: Reliability based on historical performance
- **Completion Probability**: AI-powered success prediction
- **Risk Assessment**: Identifies high-risk claims early

### 💌 **Intelligent Nudging**
- **Progressive Strategy**: Escalating notifications over time
- **Personalized Messages**: Context-aware communication
- **Multiple Channels**: Email, GitHub mentions, issue comments

### 🔄 **Auto-Resolution**
- **Configurable Grace Periods**: Flexible timing for different project needs
- **Transparent Communication**: Clear explanations for auto-releases
- **Maintainer Control**: Approval workflows for sensitive releases

### 📊 **Comprehensive Dashboard**
- **Real-time Monitoring**: Live view of all tracked repositories
- **Analytics & Insights**: Success rates, contributor performance
- **Issue Management**: Direct assignment and unassignment capabilities

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + NextAuth.js
- **Authentication**: GitHub OAuth with enhanced scopes
- **Email**: Nodemailer with SMTP support
- **AI/ML**: TensorFlow.js (ready for model integration)
- **Deployment**: Vercel (production-ready)
- **Data Storage**: In-memory with Redis support (production-ready)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- GitHub account
- SMTP email service (optional, for notifications)

### 1. Clone & Install

```bash
git clone https://github.com/naman394/WorkFlow.git
cd WorkFlow
npm install
```

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new **OAuth App**:
   - **Name**: Workflow
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy your **Client ID** and generate a **Client Secret**

### 3. Environment Variables

Create `.env.local`:

```env
# GitHub OAuth
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and start detecting cookie-licking! 🎉

## 📖 Usage Guide

### For Repository Maintainers

1. **Connect Your GitHub Account**: Authenticate via GitHub OAuth
2. **Select Repositories**: Choose which repos to monitor
3. **Configure Settings**: Set grace periods, notification preferences
4. **Monitor Dashboard**: View real-time analytics and interventions
5. **Manage Issues**: Assign/unassign contributors directly

### For Contributors

- **Clear Communication**: The system tracks all issue comments
- **Reliability Scoring**: Your historical performance affects your score
- **Smart Notifications**: Receive helpful nudges when needed
- **Transparent Process**: Understand why interventions happen

## 🔧 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/*` | GET/POST | NextAuth.js authentication |
| `/api/repositories` | GET | Fetch user's GitHub repositories |
| `/api/repository/[owner]/[repo]` | GET | Repository details and analysis |
| `/api/repository/[owner]/[repo]/issue/[number]/candidates` | GET | Issue candidates and assignments |
| `/api/github/assign` | POST | Assign/unassign users to issues |
| `/api/send-email` | POST | Send email notifications |
| `/api/send-github-mention` | POST | Send GitHub mentions |
| `/api/process` | POST | Process repository for analysis |
| `/api/webhook` | POST | GitHub webhook handler |

### Email & Notifications

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test-email` | POST | Test email functionality |
| `/api/test-smtp` | POST | Test SMTP configuration |
| `/api/github/user/[username]` | GET | Fetch GitHub user details |

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub API    │    │   NextAuth.js   │    │   Email Service │
│   Integration   │◄──►│  Authentication │◄──►│   (Nodemailer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Issue Analysis  │    │   Orchestrator  │    │  Auto-Release   │
│     Engine      │◄──►│   (Main Logic)  │◄──►│   Mechanism     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Intelligent   │    │   Web Dashboard │    │   GitHub        │
│    Nudging      │    │   (Next.js UI)  │    │   Webhooks      │
│     System      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Detection**: GitHub webhooks → Issue comment analysis → Claim extraction
2. **Analysis**: Contributor scoring → Completion probability → Risk assessment  
3. **Intervention**: Nudge scheduling → Email/mention sending → Auto-release
4. **Monitoring**: Dashboard updates → Analytics generation → Reporting

## 🎛️ Configuration

### Repository Settings

```typescript
interface RepositoryConfig {
  gracePeriodDays: number          // Default: 7 days
  maxNudges: number               // Default: 3 nudges
  nudgeIntervals: number[]        // [3, 7, 14] days
  autoReleaseEnabled: boolean     // Default: true
  maintainerNotificationEnabled: boolean
  communityNudgingEnabled: boolean
}
```

### Claim Detection Patterns

The system recognizes 50+ claim patterns including:
- `"I'll work on this"`
- `"assign this to me"`
- `"I can help"`
- `"working on it"`
- `"count me in"`
- And many more variations...

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Set Environment Variables**: Add all required env vars
3. **Deploy**: Automatic deployment on push to main

### Environment Variables for Production

```env
GITHUB_ID=your_production_client_id
GITHUB_SECRET=your_production_client_secret
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Optional: Email notifications
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and install
git clone https://github.com/naman394/WorkFlow.git
cd WorkFlow
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── select-repository/ # Repository selection
│   └── repository/        # Repository detail pages
├── lib/                   # Core business logic
│   ├── orchestrator.ts    # Main detector logic
│   ├── analysis.ts        # Issue analysis engine
│   ├── nudging.ts         # Intelligent nudging
│   ├── auto-release.ts    # Auto-release mechanism
│   └── email-service.ts   # Email notifications
└── components/            # Reusable UI components
```

## 📊 Analytics & Metrics

The dashboard provides insights into:

- **Issue Analysis**: Total issues, active claims, resolved claims
- **Success Rates**: Completion probability by contributor
- **Intervention Effectiveness**: Nudge response rates
- **Auto-Release Impact**: Time saved and issues reopened

## 🔮 Roadmap

### Phase 1: Core Detection ✅
- [x] GitHub integration
- [x] Claim pattern recognition
- [x] Basic analytics dashboard

### Phase 2: Intelligence 🚧
- [x] Contributor scoring
- [x] Completion probability prediction
- [x] Intelligent nudging system
- [x] Email notifications

### Phase 3: Automation 🚧
- [x] Auto-release mechanism
- [x] Webhook integration
- [x] GitHub mentions

### Phase 4: Advanced AI 🔮
- [ ] Machine learning model training
- [ ] Natural language processing
- [ ] Advanced behavioral analysis
- [ ] Community-driven resolution

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the open source community
- Inspired by real-world contributor experiences
- Powered by GitHub's amazing API
- Deployed on Vercel's excellent platform

## 📞 Support

- 📧 **Email**: [navnitnaman48@gmail.com](mailto:navnitnaman48@gmail.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/naman394/WorkFlow/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/naman394/WorkFlow/discussions)

---

**Made with ❤️ for the open source community**

*Stop cookie-licking. Start collaborating.*